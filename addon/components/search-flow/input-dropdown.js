import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A } from '@ember/array';
import { schedule } from '@ember/runloop';
import { later, cancel } from '@ember/runloop';
import config from 'ember-get-config';
import { escape } from '../../utils/escape-expression';
const searchflowConfig = config['ember-search-flow'];

export default class InputDropdownComponent extends Component {
  @tracked value = '';
  @tracked isLoading = false;
  @tracked currentRequestUid = null;
  @tracked queryTimeout = null;
  @tracked shouldRemoveFilter = false;
  @tracked _availableOptions = A([]);

  inputElement = null;
  wrapperElement = null;

  constructor() {
    super(...arguments);
    if (this.args.filter?.value) {
      this.value = `${this.args.filter.isContains ? 'Contains: ' : ''}${this.args.filter.value}`;
    }
    
    schedule('afterRender', this, () => {
      if (!this.value) {
        if (this.args.filter) {
          this.args.filter.isFocused = true;
        }
        this.focusInput();
      }
    });
  }

  async requestWithTimeout(value, parameter, requestUid) {
    let options = await this.args.onValueUpdated(value, parameter);
    if (!this.isDestroying && !this.isDestroyed && this.currentRequestUid === requestUid) {
      if (this.args.filter?.parameter) {
        this.args.filter.parameter.options = options;
      }
      this.isLoading = false;
    }
  }

  fetchOptions() {
    if (this.args.remoteFiltering) {
      if(searchflowConfig && searchflowConfig.optionsTimeout) {
        let queryTimeout = searchflowConfig.optionsTimeout;
        let requestUid = Math.random();
        this.currentRequestUid = requestUid;
        this.isLoading = true;

        if (this.queryTimeout) {
          cancel(this.queryTimeout);
        }
        this.queryTimeout = later(this, this.requestWithTimeout, this.value, this.args.filter?.parameter, requestUid, queryTimeout);
      }
      else{
        this.args.onValueUpdated?.(this.value, this.args.filter?.parameter);
      }
    }
  }

  setInputWidth(element) {
    if (!element) return;
    
    let sanitizedTempValue = escape(this.value || this.args.placeholder || '');
    element.insertAdjacentHTML('beforeend', '<div class="search-flow search-flow_option search-flow_temp-div" style="position:fixed;left: -10000px;visibility:hidden">'.concat(sanitizedTempValue, '</div>'));
    let tempDiv = element.querySelector('.search-flow_temp-div');
    let input = element.querySelector('.search-flow_input');
    if (input && tempDiv) {
      input.style.width = `${tempDiv.offsetWidth + 3}px`;
      tempDiv.remove();
    }
  }

  get availableOptions() {
    let options = this.args.options;
    if (!options || !this.args.filter?.isFocused) {
      return A([]);
    }

    // Convert options to array of objects if it is an array of strings
    options = options.map(option => {
      if (this.args.isParameterSelection) {
        return { title: option.title, value: option };
      }
      else {
        return { title: option, value: option };
      }
    });

    if (!this.args.remoteFiltering) {
      options = options.filter(option => {
        return option.title?.toLowerCase().includes(this.value.toLowerCase());
      });
    }

    // Sort options in alphabetical order if the sort parameter is true
    if (this.args.filter?.parameter?.sort){
      options = options.sortBy('title');
    }

    // Insert contains option into list
    if (this.args.filter?.parameter?.contains && this.value && options.length) {
      options.unshift({ title: `Contains: ${this.value}`, value: this.value, isContains: true });
    }

    // Set the index on each item for easy access later on
    options.forEach((option, index) => {
      option.index = index;
    });

    // Ensure first option is selected
    options.setEach('isActive', false);
    if (options.firstObject) {
      options.firstObject.isActive = true;
    }

    return options;
  }

  get activeOption() {
    return this.availableOptions.findBy('isActive');
  }

  blurInput() {
    if (!this.inputElement) return;
    let isInFocus = this.inputElement === document.activeElement;
    if (isInFocus) {
      this.inputElement.blur();
    }
  }

  focusInput() {
    if (!this.inputElement) return;
    let isInFocus = this.inputElement === document.activeElement;
    if (!isInFocus) {
      this.inputElement.focus();
    }
  }

  @action
  setupInput(element) {
    this.wrapperElement = element;
    this.inputElement = element.querySelector('.search-flow_input');
    this.setInputWidth(element);
  }

  @action 
  updateValue(event) {
    this.value = event.target.value;
    if (this.args.filter?.isFocused) {
      this.fetchOptions();
    }
    if (this.wrapperElement) {
      this.setInputWidth(this.wrapperElement);
    }
  }

  @action 
  selectOption() {
    let activeOption = this.activeOption;
    if (this.args.filter) {
      this.args.filter.isFocused = false;
    }
    
    if (this.args.isParameterSelection) {
      this.args.newFilter?.(activeOption.value);
    }
    else {
      if (this.args.filter) {
        this.args.filter.value = activeOption.value;
        if (activeOption.isContains) {
          this.args.filter.isContains = true;
          this.value = `Contains: ${activeOption.value}`;
        }
        else {
          this.args.filter.isContains = false;
          this.value = activeOption.value;
        }
      }
    }
    this.blurInput();
    this.args.inputBlurredAction?.(this.args.isParameterSelection, this.args.filter);
  }

  @action 
  inputKeyDown(event) {
    if (event.which === 38) { // Up
      event.preventDefault();
      let previousItem = this.availableOptions[this.activeOption?.index - 1];
      if (previousItem && this.activeOption) {
        this.activeOption.isActive = false;
        previousItem.isActive = true;
      }
    }
    else if (event.which === 40) { // Down
      event.preventDefault();
      let nextItem = this.availableOptions[this.activeOption?.index + 1];
      if (nextItem && this.activeOption) {
        this.activeOption.isActive = false;
        nextItem.isActive = true;
      }
    }
    else if (event.which === 8 && !this.value) { // Backspace
      // If backspace is hit with no value typed in, blur
      this.shouldRemoveFilter = true;
      this.blurInput();
    }
  }

  @action 
  inputKeyUp(event) {
    // Prevent the up or down key from moving the cursor when releasing the key
    if (event.which === 38 || event.which === 40) { // Up or Down
      event.preventDefault();
    }
    else if (event.which === 13) { // Enter key
      // Make sure user can hit enter after key released
      // Ensure item is not selected from previous enter key hit from 'Add Filter' button
      if (this.activeOption) {
        this.selectOption();
      }
    }
  }

  @action 
  inputFocused() {
    this.fetchOptions();
    if (this.args.filter) {
      this.args.filter.isFocused = true;
      if (this.args.filter.isContains) {
        this.value = this.args.filter.value;
      }
    }
  }

  @action 
  inputBlurred() {
    // Ensure the filter is not removed with clicking on an option
    if (this.wrapperElement) {
      if ((this.wrapperElement.querySelector('.search-flow_dropdown-option:hover') || this.args.didHitEnter) && !this.shouldRemoveFilter) {
        return;
      }
    }

    // Set the value to what the original filter value was
    if (this.args.filter) {
      this.args.filter.isFocused = false;
      if (this.args.filter.isContains) {
        this.value = `Contains: ${this.args.filter.value}`;
      }
    }
    this.args.inputBlurredAction?.(this.args.isParameterSelection, this.args.filter, this.shouldRemoveFilter);
  }
}
