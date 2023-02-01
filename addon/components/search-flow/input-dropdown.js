import Component from '@ember/component';
import { schedule } from '@ember/runloop';
import { observer, computed, set, action } from '@ember/object';
import  { A } from '@ember/array';
import layout from '../../templates/components/search-flow/input-dropdown';
import { later, cancel } from '@ember/runloop';
import { classNames, layout as templateLayout } from '@ember-decorators/component';
import { observes } from '@ember-decorators/object';
import config from 'ember-get-config';
const seachflowConfig = config['ember-search-flow'];

@templateLayout(layout)
@classNames('search-flow_input-dropdown')
export default class InputDropdown extends Component {
  init() {
    super.init(...arguments);
    if (this.get('filter.value')) {
      this.set('value', `${this.get('filter.isContains') ? 'Contains: ' : ''}${this.get('filter.value')}`);
    }
    else {
      this.set('value', '');
    }
    schedule('afterRender', this, function () {
      if (!this.get('value')) {
        if (!this.get('filter')) {
          this.set('filter', {});
        }
        this.set('filter.isFocused', true);
        this.focusInput();
      }
    });
  }

  didInsertElement() {
    this.setInputWidth();
  }

  async requestWithTimeout(value, parameter, requestUid) {
    let options = await this.get('onValueUpdated')(value, parameter);
    if (!this.get('isDestroyed') && this.get('currentRequestUid') === requestUid) {
      this.set('filter.parameter.options', options);
      this.set('isLoading', false);
    }
  }

  fetchOptions() {
    if (this.get('remoteFiltering')) {
      if(seachflowConfig && seachflowConfig.optionsTimeout) {
        let queryTimeout = seachflowConfig.optionsTimeout;
        let requestUid = Math.random();
        this.set('currentRequestUid', requestUid);
        this.set('isLoading', true);

        if (this.get('queryTimeout')) {
          cancel(this.get('queryTimeout'));
        }
        this.set('queryTimeout', later(this, this.requestWithTimeout, this.get('value'), this.get('filter.parameter'), requestUid, queryTimeout));
      }
      else{
        this.get('onValueUpdated')(this.get('value'), this.get('filter.parameter'));
      }
    }
  }

  @observes('value')
  valueChanged() {
    if (this.get('filter.isFocused')) {
      this.fetchOptions();
    }
    this.setInputWidth();
  }

  setInputWidth() {
    this.element.insertAdjacentHTML('beforeend', '<div class="search-flow search-flow_option search-flow_temp-div" style="position:fixed;left: -10000px;visibility:hidden">'.concat(this.get('value') || this.get('placeholder'), '</div>'));
    let tempDiv = this.element.querySelector('.search-flow_temp-div');
    this.element.querySelector('.search-flow_input').style.width = `${tempDiv.offsetWidth + 3}px`;
    tempDiv.remove();
  }

  @computed('options.[]', 'value')
  get availableOptions() {
    let options = this.get('options');
    if (!options || !this.get('filter.isFocused')) {
      return A([]);
    }

    // if (this.get('filter.isFocused')) {
    //   this.fetchOptions();
    // }
    // this.setInputWidth();

    // Convert options to array of objects if it is an array of strings
    options = options.map(option => {
      if (this.get('isParameterSelection')) {
        option = { title: option.title, value: option };
      }
      else {
        option = { title: option, value: option };
      }
      return option;
    });

    if (!this.get('remoteFiltering')) {
      options = options.filter(option => {
        return option.title.toLowerCase().includes(this.get('value').toLowerCase());
      });
    }

    // Sort options in alphabetical order if the sort parameter is true
    if (this.get('filter.parameter.sort')){
      options = options.sortBy('title');
    }

    // Insert contains option into list
    if (this.get('filter.parameter.contains') && this.get('value') && options.length) {
      options.unshift({ title: `Contains: ${this.get('value')}`, value: this.get('value'), isContains: true });
    }

    // Set the index on each item for easy access later on
    options.forEach((option, index) => {
      option.index = index;
    });

    // Ensure first option is selected
    options.setEach('isActive', false);
    if (options.get('firstObject')) {
      options.set('firstObject.isActive', true);
    }

    return options;
  }

  @computed('availableOptions.@each.isActive')
  get activeOption() {
    return this.get('availableOptions').findBy('isActive');
  }

  blurInput() {
    let input = this.element.querySelector('.search-flow_input');
    let isInFocus = this.element.querySelector('.search-flow_input') === document.activeElement;
    if (isInFocus) {
      input.blur();
    }
  }

  focusInput() {
    let input = this.element.querySelector('.search-flow_input');
    let isInFocus = this.element.querySelector('.search-flow_input') === document.activeElement;
    if (!isInFocus) {
      input.focus();
    }
  }


  @action selectOption() {
    let activeOption = this.get('activeOption');
    this.set('filter.isFocused', false);
    if (this.get('isParameterSelection')) {
      this.get('newFilter')(activeOption.value);
    }
    else {

      this.set('filter.value', activeOption.value);
      if (activeOption.isContains) {
        this.set('filter.isContains', true);
        this.set('value', `Contains: ${activeOption.value}`);
      }
      else {
        this.set('filter.isContains', false);
        this.set('value', activeOption.value);
      }
    }
    this.blurInput();
    this.get('inputBlurredAction')(this.get('isParameterSelection'), this.get('filter'));
  }

  @action inputKeyDown(event) {
    if (event.which === 38) { // Up
      event.preventDefault();
      let previousItem = this.get(`availableOptions.${this.get('activeOption.index') - 1}`);
      if (previousItem) {
        this.set('activeOption.isActive', false);
        set(previousItem, 'isActive', true);
      }
    }
    else if (event.which === 40) { // Down
      event.preventDefault();
      let nextItem = this.get(`availableOptions.${this.get('activeOption.index') + 1}`);
      if (nextItem) {
        this.set('activeOption.isActive', false);
        set(nextItem, 'isActive', true);
      }
    }
    else if (event.which === 8 && !this.get('value')) { // Backspace
      // If backspace is hit with no value typed in, blur
      this.set('shouldRemoveFilter', true);
      this.blurInput();
    }
  }

  @action inputKeyUp(event) {
    // Prevent the up or down key from moving the cursor when releasing the key
    if (event.which === 38 || event.which === 40) { // Up or Down
      event.preventDefault();
    }
    else if (event.which === 13) { // Enter key
      // Make sure user can hit enter after key released
      // Ensure item is not selected from previous enter key hit from 'Add Filter' button
      if (!!this.get('activeOption')) {
        this.send('selectOption', this.get('activeOption'));
      }
    }
  }

  @action inputFocused() {
    this.fetchOptions();
    this.set('filter.isFocused', true);
    if (this.get('filter.isContains')) {
      this.set('value', this.get('filter.value'));
    }
  }

  @action inputBlurred() {
    // Ensure the filter is not removed with clicking on an option
    if ((this.element.querySelector('.search-flow_dropdown-option:hover') || this.get('didHitEnter')) && !this.get('shouldRemoveFilter')) {
      return;
    }

    // Set the value to what the original filter value was
    this.set('filter.isFocused', false);
    if (this.get('filter.isContains')) {
      this.set('value', `Contains: ${this.get('filter.value')}`);
    }
    this.get('inputBlurredAction')(this.get('isParameterSelection'), this.get('filter'), this.get('shouldRemoveFilter'));
  }
}
