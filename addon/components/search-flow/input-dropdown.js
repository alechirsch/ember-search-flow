import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
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
  @tracked isFocused = false; // Track focus state locally for reactivity
  inputElement = null;

  constructor() {
    super(...arguments);
    if (this.args.filter?.value) {
      this.value = `${this.args.filter.isContains ? 'Contains: ' : ''}${this.args.filter.value}`;
    }
    
    schedule('afterRender', this, () => {
      if (!this.value && this.args.filter) {
        this.focusInput();
      }
      this.setInputWidth();
    });
  }

  async requestWithTimeout(value, parameter, requestUid) {
    let options = await this.args.onValueUpdated(value, parameter);
    if (!this.isDestroying && !this.isDestroyed && this.currentRequestUid === requestUid) {
      if (this.args.filter?.parameter) {
        set(this.args.filter.parameter, 'options', options);
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

  setInputWidth() {
    if (!this.inputElement) return;
    
    let parentElement = this.inputElement.parentElement?.parentElement;
    if (!parentElement) return;
    
    let sanitizedTempValue = escape(this.value || this.args.placeholder || '');
    parentElement.insertAdjacentHTML('beforeend', '<div class="search-flow search-flow_option search-flow_temp-div" style="position:fixed;left: -10000px;visibility:hidden">'.concat(sanitizedTempValue, '</div>'));
    let tempDiv = parentElement.querySelector('.search-flow_temp-div');
    if (tempDiv) {
      this.inputElement.style.width = `${tempDiv.offsetWidth + 3}px`;
      tempDiv.remove();
    }
  }

  focusInput() {
    if (this.inputElement && document.activeElement !== this.inputElement) {
      this.inputElement.focus();
    }
  }

  blurInput() {
    if (this.inputElement && document.activeElement === this.inputElement) {
      this.inputElement.blur();
    }
  }

  @action
  registerInput(element) {
    this.inputElement = element;
    schedule('afterRender', this, () => {
      this.setInputWidth();
    });
  }

  @action
  wrapperClicked() {
    this.focusInput();
  }

  get availableOptions() {
    let options = this.args.options;
    
    // Check if filter is focused (use local tracked property) or if it's parameter selection
    if (!this.isFocused && !this.args.isParameterSelection) {
      return A([]);
    }
    
    // For remote filtering, options might be undefined initially - return empty array
    if (!options) {
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
    this.setInputWidth();
  }

  @action 
  selectOption(clickedOption) {
    // Use the clicked option if provided, otherwise fall back to activeOption (for keyboard selection)
    let activeOption = clickedOption || this.activeOption;
    
    // Set local tracked property
    this.isFocused = false;
    
    if (this.args.filter) {
      set(this.args.filter, 'isFocused', false); // Use set() for reactivity
      this.args.onFocusChange?.();
    }
    
    if (this.args.isParameterSelection) {
      this.args.newFilter?.(activeOption.value);
    }
    else {
      if (this.args.filter) {
        set(this.args.filter, 'value', activeOption.value);
        if (activeOption.isContains) {
          set(this.args.filter, 'isContains', true);
          this.value = `Contains: ${activeOption.value}`;
        }
        else {
          set(this.args.filter, 'isContains', false);
          this.value = activeOption.value;
        }
        schedule('afterRender', this, () => {
          this.setInputWidth();
        });
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
    // Set local tracked property for reactivity FIRST
    this.isFocused = true;
    this.fetchOptions();
    
    if (this.args.filter) {
      set(this.args.filter, 'isFocused', true); // Use set() for reactivity
      this.args.onFocusChange?.();
      if (this.args.filter.isContains) {
        this.value = this.args.filter.value;
        schedule('afterRender', this, () => {
          this.setInputWidth();
        });
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
        // Reset didHitEnter flag after handling
        if (this.args.isParameterSelection) {
          this.args.inputBlurredAction?.(this.args.isParameterSelection, this.args.filter, this.shouldRemoveFilter);
        }
        return;
      }

      // Set the value to what the original filter value was
      this.isFocused = false; // Set local tracked property
      
      if (this.args.filter) {
        set(this.args.filter, 'isFocused', false); // Use set() for reactivity
        this.args.onFocusChange?.();
        if (this.args.filter.isContains) {
          this.value = `Contains: ${this.args.filter.value}`;
          schedule('afterRender', this, () => {
            this.setInputWidth();
          });
        }
      }
      this.args.inputBlurredAction?.(this.args.isParameterSelection, this.args.filter, this.shouldRemoveFilter);
    }, 150);
  }
}

export default setComponentTemplate(layout, InputDropdownComponent);
