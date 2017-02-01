import Ember from 'ember';
import layout from '../../templates/components/search-flow/input-dropdown';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_input-dropdown'],
  router: Ember.inject.service('-routing'),
  init() {
    this._super(...arguments);
    if (this.get('filter.value')) {
      this.set('value', `${this.get('filter.isContains') ? 'Contains: ' : ''}${this.get('filter.value')}`);
    }
    else {
      this.set('value', '');
    }
    Ember.run.schedule('afterRender', this, function () {
      if (!this.get('value')) {
        if (!this.get('filter')) {
          this.set('filter', Ember.Object.create({}));
        }
        this.set('filter.isFocused', true);
        this.focusInput();
      }
    });
  },
  didInsertElement() {
    this.setInputWidth();
  },
  getCurrentRoute() {
    return Ember.getOwner(this).lookup(`route:${this.get('router.currentRouteName')}`);
  },
  fetchOptions() {
    if (this.get('remoteFiltering')) {
      this.get('onValueUpdated')(this.get('value'), this.get('filter.parameter'));
    }
  },
  valueObserver: Ember.observer('value', function () {
    if (this.get('filter.isFocused')) {
      this.fetchOptions();
    }
    this.setInputWidth();
  }),
  setInputWidth() {
    let tempDiv = this.$(`<div class="search-flow_temp-div" style="display:none">${this.get('value') || this.get('placeholder')}</div>`).appendTo('body');
    this.$('.search-flow_input').css('width', tempDiv.width() + 3);
    tempDiv.remove();
  },
  availableOptions: Ember.computed('options.[],value', function () {
    let options = this.get('options');
    if (!options || !this.get('filter.isFocused')) {
      return Ember.A([]);
    }

    // Convert options to array of objects if it is an array of strings
    options = options.map(option => {
      if (this.get('isParameterSelection')) {
        option = Ember.Object.create({ title: option.title, value: option });
      }
      else {
        option = Ember.Object.create({ title: option, value: option });
      }
      return option;
    });

    if (!this.get('remoteFiltering')) {
      options = options.filter(option => {
        return option.title.toLowerCase().includes(this.get('value').toLowerCase());
      });
    }

    // Options should always be in alphabetical order
    options = options.sortBy('title');


    // Insert contains option into list
    if (this.get('filter.parameter.contains') && this.get('value') && options.length) {
      options.unshift(Ember.Object.create({ title: `Contains: ${this.get('value')}`, value: this.get('value'), isContains: true }));
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
  }),
  activeOption: Ember.computed('availableOptions.@each.isActive', function () {
    return this.get('availableOptions').findBy('isActive');
  }),
  blurInput() {
    let input = this.$('.search-flow_input');
    if (input.is(':focus')) {
      input.blur();
    }
  },
  focusInput() {
    let input = this.$('.search-flow_input');
    if (!input.is(':focus')) {
      input.focus();
    }
  },
  actions: {
    selectOption() {
      let activeOption = this.get('activeOption');
      this.set('filter.isFocused', false);
      if (this.get('isParameterSelection')) {
        this.get('newFilter')(activeOption.get('value'));
      }
      else {
        
        this.set('filter.value', activeOption.get('value'));
        if (activeOption.get('isContains')) {
          this.set('filter.isContains', true);
          this.set('value', `Contains: ${activeOption.get('value')}`);
        }
        else {
          this.set('filter.isContains', false);
          this.set('value', activeOption.get('value'));
        }
      }
      this.blurInput();
      this.get('inputBlurred')(this.get('isParameterSelection'), this.get('filter'));
    },
    inputEntered() {
      // Ensure item is not selected from previous enter key hit from 'Add Filter' button
      if (!this.get('didHitEnter') && !!this.get('activeOption')) {
        this.set('didHitEnter', true);
        this.send('selectOption', this.get('activeOption'));
      }
    },
    inputKeyDown() {
      if (event.which === 38) { // Up
        event.preventDefault();
        let previousItem = this.get(`availableOptions.${this.get('activeOption.index') - 1}`);
        if (previousItem) {
          this.set('activeOption.isActive', false);
          Ember.set(previousItem, 'isActive', true);
        }
      }
      else if (event.which === 40) { // Down
        event.preventDefault();
        let nextItem = this.get(`availableOptions.${this.get('activeOption.index') + 1}`);
        if (nextItem) {
          this.set('activeOption.isActive', false);
          Ember.set(nextItem, 'isActive', true);
        }
      }
      else if (event.which === 8 && !this.get('value')) { // Backspace
        // If backspace is hit with no value typed in, blur
        this.set('shouldRemoveFilter', true);
        this.blurInput();
      }
    },
    inputKeyUp() {
      // Prevent the up or down key from moving the cursor when releasing the key
      if (event.which === 38 || event.which === 40) { // Up or Down
        event.preventDefault();
      }
      else if (event.which === 13) { // Enter key
        // Make sure user can hit enter after key released
        this.set('didHitEnter', false);
      }
    },
    inputFocused() {
      this.fetchOptions();
      this.set('filter.isFocused', true);
      if (this.get('filter.isContains')) {
        this.set('value', this.get('filter.value'));
      }
    },
    inputBlurred() {
      // Ensure the filter is not removed with clicking on an option
      if ((this.$('.search-flow_dropdown-option:hover').length || this.get('didHitEnter')) && !this.get('shouldRemoveFilter')) {
        return;
      }

      // Set the value to what the original filter value was
      this.set('filter.isFocused', false);
      if (this.get('filter.isContains')) {  
        this.set('value', `Contains: ${this.get('filter.value')}`);
      }
      this.get('inputBlurred')(this.get('isParameterSelection'), this.get('filter'), this.get('shouldRemoveFilter'));
    }
  }
});
