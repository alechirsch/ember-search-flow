import Ember from 'ember';
import layout from '../../templates/components/search-flow/input-dropdown';
const selectedOptionClass = '.search-flow_dropdown-option-active';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_input-dropdown'],
  router: Ember.inject.service('-routing'),
  init(){
    this._super(...arguments);
    this.set('placeholder', this.get('searchQuery.parameter.placeholder') || '');
    if (!this.get('searchQuery.value')){
      this.set('isFocused', true);
    }
    if (!this.isParameterSelection() && this.get('searchQuery.parameter.remoteOptions')){
      this.sendActionToRoute('searchFlowValueUpdated', this.get('searchQuery'));
    }
  },
  didInsertElement(){
    let input = this.$('input');
    if (!this.get('searchQuery.value')){
      input.focus();
    } 
    this.setInputWidth(input);
    
    input.on('blur', event => {
      // Ensure the searchQuery is not removed with clicking on an option
      let searchQuery = this.get('searchQuery');
      if (!this.$('.search-flow_dropdown-option:hover').length){
        this.set('isFocused', false);
        this.get('inputBlurred')(searchQuery, this.isParameterSelection());
      }
      
      if (!this.get('searchQuery.value') && !this.isParameterSelection()){
        searchQuery = null;
      }
      this.get('inputBlurred')(searchQuery, this.isParameterSelection());
    }).on('focus', () => {
      this.set('isFocused', true);
      this.get('inputFocused')();
    }).on('keydown', event => {
      // Blur on enter key
      if (event.which === 13 && this.optionIsSelected()) {
        event.preventDefault();
        this.selectOptionByEnter();
      }
      else if (event.which === 38){ // Up
        event.preventDefault();
        let selected = this.$(selectedOptionClass);
        if (selected.prev().hasClass('search-flow_dropdown-option')){
          selected.removeClass('search-flow_dropdown-option-active');
          selected.prev().addClass('search-flow_dropdown-option-active');
        }
      }
      else if (event.which === 40){ // Down
        event.preventDefault();
        let selected = this.$(selectedOptionClass);
        if (selected.next().hasClass('search-flow_dropdown-option')){
          selected.removeClass('search-flow_dropdown-option-active');
          selected.next().addClass('search-flow_dropdown-option-active');
        }
      }
    }).on('keyup', event => { 
      if(event.which === 38 || event.which === 40){
        event.preventDefault();
      }
    });
  },
  didRender(){
    this.$('.search-flow_dropdown-option')
      .hover(event => {
        this.$('.search-flow_dropdown-option').removeClass('search-flow_dropdown-option-active');
        this.$(event.target).addClass('search-flow_dropdown-option-active');
        //debugger;
      })
      .removeClass('search-flow_dropdown-option-active')
      .first()
      .addClass('search-flow_dropdown-option-active');
      
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
  optionIsSelected(){
    return this.$(selectedOptionClass).length === 1;
  },
  selectOptionByEnter(){
    this.send('selectOption', this.$(selectedOptionClass).text());
  },
  isParameterSelection(){
    return !!this.get('parameters');
  },
  availableOptions: Ember.computed('availableParameters,searchQuery,searchQuery.parameter.options.[],searchQuery.value', function(){
    let availableOptions = Ember.A([]);

    if (this.get('availableParameters')){
      availableOptions = this.get('availableParameters').map(parameter => {
        return parameter.title;
      });
    }
    else {
      if (this.get('searchQuery.parameter.options')){
        availableOptions = this.get('searchQuery.parameter.options');
      }
    }
    if (this.get('searchQuery.parameter.remoteOptions')){
      return availableOptions;
    }

    return availableOptions.filter(option => {
      return option.toLowerCase().includes(this.get('searchQuery.value').toLowerCase());
    });
  }),
  valueObserver: Ember.observer('searchQuery.value,isFocused', function() {
    this.setInputWidth(this.$('input'));
    if (!this.isParameterSelection() && this.get('isFocused')){
      this.sendActionToRoute('searchFlowValueUpdated', this.get('searchQuery'));
    }
  }),
  setInputWidth(input){
    let tempDiv = this.$(`<div class="search-flow_temp-div" style="display:none">${this.get('searchQuery.value') || this.get('searchQuery.parameter.placeholder')}</div>`).appendTo('body');
    input.css('width', tempDiv.width() + 3); 
    tempDiv.remove();
  },
  actions: {
    selectOption(option){
      
      if (this.isParameterSelection()){
        this.set('searchQuery.parameter', this.get('parameters').findBy('title', option));
        this.set('searchQuery.value', '');
      }
      else {
        this.set('searchQuery.value', option);
        this.set('isFocused', false);
      }
      this.$('input').blur();
    }
  }
});
