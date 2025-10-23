import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A } from '@ember/array';
import { schedule } from '@ember/runloop';
import { later, cancel } from '@ember/runloop';
import config from 'ember-get-config';
import { escape } from '../../utils/escape-expression';
import { setComponentTemplate } from '@ember/component';
import layout from '../../templates/components/search-flow/input-dropdown';
const searchflowConfig = config['ember-search-flow'];

class InputDropdownComponent extends Component {
  @tracked value = '';
  @tracked isLoading = false;
  @tracked currentRequestUid = null;
  @tracked queryTimeout = null;
  @tracked shouldRemoveFilter = false;
  @tracked _availableOptions = A([]);

  constructor() {
    super(...arguments);
    if (this.args.filter?.value) {
      this.value = `${this.args.filter.isContains ? 'Contains: ' : ''}${this.args.filter.value}`;
    }
    
    schedule('afterRender', this, () => {
      if (!this.value && this.args.filter) {
        this.args.filter.isFocused = true;
        this.args.onFocusChange?.();
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

  get inputSize() {
    // Calculate the size attribute based on value or placeholder length
    const text = this.value || this.args.placeholder || '';
    // Add some padding to the size calculation
    return Math.max(1, text.length + 1);
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
      options = options.sort((a, b) => {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        return titleA.localeCompare(titleB);
      });
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
    options.forEach(opt => opt.isActive = false);
    if (options[0]) {
      options[0].isActive = true;
    }

    return options;
  }

  get activeOption() {
    return this.availableOptions.find(opt => opt.isActive);
  }

  @action 
  updateValue(event) {
    this.value = event.target.value;
    if (this.args.filter?.isFocused) {
      this.fetchOptions();
    }
  }

  @action 
  selectOption() {
    let activeOption = this.activeOption;
    if (this.args.filter) {
      this.args.filter.isFocused = false;
      this.args.onFocusChange?.();
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
      this.args.onFocusChange?.();
      if (this.args.filter.isContains) {
        this.value = this.args.filter.value;
      }
    }
  }

  @action 
  inputBlurred(event) {
    // Small delay to allow click events on dropdown options to fire first
    setTimeout(() => {
      if (this.isDestroying || this.isDestroyed) return;
      
      // Check if user clicked on a dropdown option
      if (this.args.didHitEnter && !this.shouldRemoveFilter) {
        return;
      }

      // Set the value to what the original filter value was
      if (this.args.filter) {
        this.args.filter.isFocused = false;
        this.args.onFocusChange?.();
        if (this.args.filter.isContains) {
          this.value = `Contains: ${this.args.filter.value}`;
        }
      }
      this.args.inputBlurredAction?.(this.args.isParameterSelection, this.args.filter, this.shouldRemoveFilter);
    }, 150);
  }
}

export default setComponentTemplate(layout, InputDropdownComponent);
