import Ember from 'ember';
import layout from '../../templates/components/search-flow/input-dropdown';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_input-dropdown'],
  router: Ember.inject.service('-routing'),
  init(){
    this._super(...arguments);
    Ember.run.schedule('afterRender', this, function () {
      if (!this.get('value')){
        if (!this.get('filter')){
          this.set('filter', Ember.Object.create({}));
        }
        this.set('filter.isFocused', true);
        this.$('.search-flow_input').focus();
      }
    });
  },
  didInsertElement(){
    this.setInputWidth();
  },
  getCurrentRoute(){
    return Ember.getOwner(this).lookup(`route:${this.get('router.currentRouteName')}`);
  },
  sendActionToRoute(action, arg){
    try {
      this.getCurrentRoute().send(action, arg);
    }
    catch (error){
      // The action does not exist
      return;
    }
  },
  fetchOptions(){
    if (this.get('remoteFiltering')){
      this.sendActionToRoute('searchFlowValueUpdated', this.get('filter'));
    }
  },
  valueObserver: Ember.observer('value', function(){
    if (this.get('filter')){
      this.set('filter.value', this.get('value'));
      this.fetchOptions();
      this.setInputWidth();
    }
  }),
  setInputWidth(){
    let tempDiv = this.$(`<div class="search-flow_temp-div" style="display:none">${this.get('value') || this.get('placeholder')}</div>`).appendTo('body');
    this.$('.search-flow_input').css('width', tempDiv.width() + 3); 
    tempDiv.remove();
  },
  availableOptions: Ember.computed('options.[],value', function(){
    let options = this.get('options');
    if (!options){
      return null;
    }

    // Convert options to array of objects if it is an array of strings
    options = options.map(option => {
      if(typeof option === 'string'){
        option = { title: option, value: option };
      }
      else {
        option = { title: option.title, value: option };
      }
      return option;
    });

    if(!this.get('remoteFiltering')){
      options = options.filter(option => {
        return option.title.toLowerCase().includes(this.get('value').toLowerCase());
      });
    }

    // Set the index on each item for easy access later on
    options = options.sortBy('title');
    options.forEach((option, index) => {
      option.index = index;
    });

    // Ensure first option is selected
    options.setEach('isActive', false);
    if (options.get('firstObject')){
      options.set('firstObject.isActive', true);
    }

    return options;
  }),
  activeOption: Ember.computed('availableOptions.@each.isActive', function(){
    return this.get('availableOptions').findBy('isActive');
  }),
  blurInput(){
    this.$('.search-flow_input').blur();
  },
  actions: {
    selectOption(){
      if (this.get('isParameterSelection')){
        this.get('newFilter')(this.get('activeOption.value'));
      }
      else {
        this.set('value', this.get('activeOption.value'));
      }
      this.set('filter.isFocused', false);
      this.blurInput();
      this.get('inputBlurred')(this.get('isParameterSelection'), this.get('filter'));
    },
    inputEntered(){
      // Ensure item is not selected from preivous enter key hit from 'Add Filter' button
      if (!this.get('didHitEnter') && this.get('activeOption')){
        this.set('didHitEnter', true);
        this.send('selectOption', this.get('activeOption'));
      }
    },
    inputKeyDown(){
      if (event.which === 38){ // Up
        event.preventDefault();
        let previousItem = this.get(`availableOptions.${this.get('activeOption.index') - 1}`);
        if (previousItem){
          this.set('activeOption.isActive', false);
          Ember.set(previousItem, 'isActive', true);
        }
      }
      else if (event.which === 40){ // Down
        event.preventDefault();
        let nextItem = this.get(`availableOptions.${this.get('activeOption.index') + 1}`);
        if (nextItem){
          this.set('activeOption.isActive', false);
          Ember.set(nextItem, 'isActive', true);
        }
      }
      else if (event.which === 8 && !this.get('value')){ // Backspace
        // If backspace is hit with no value typed in, blur
        this.blurInput();
      }
    },
    inputKeyUp(){
      // Prevent the up or down key from moving the cursor when releasing the key
      if (event.which === 38 || event.which === 40){ // Up or Down
        event.preventDefault();
      }
      else if (event.which === 13){ // Enter key
        // Make sure user can hit enter after key released
        this.set('didHitEnter', false);
      }
    },
    inputFocused(){
      this.fetchOptions();
      this.set('filter.isFocused', true);
    },
    inputBlurred(){
      // Ensure the filter is not removed with clicking on an option
      if (this.$('.search-flow_dropdown-option:hover').length || Ember.$('.search-flow_remove:hover').length){
        return;
      }
      this.set('filter.isFocused', false);
      this.set('filter.value', this.get('activeOption.title'));
      this.get('inputBlurred')(this.get('isParameterSelection'), this.get('filter'));
    }
  }
});
