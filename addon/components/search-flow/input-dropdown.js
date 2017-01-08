import Ember from 'ember';
import layout from '../../templates/components/search-flow/input-dropdown';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_input-dropdown'],
  init(){
    this._super(...arguments);
    this.set('placeholder', this.get('searchQuery.parameter.placeholder') || '');
    if (!this.get('value')){
      this.set('isFocused', true);
    }
  },
  didInsertElement(){
    let input = this.$('input');
    if (!this.get('value')){
      input.focus();
    } 
    this.setInputWidth(input);
    
    input.on('blur', () => {
      // Ensure the searchQuery is not removed with clicking on an option
      if (!this.$('.search-flow_dropdown-option:hover').length){
        this.set('isFocused', false);
        this.get('inputBlurred')(this.get('searchQuery'));
      }
    }).on('focus', () => {
      this.set('isFocused', true);
      this.get('inputFocused')();
    }).on('keypress', event => {
      // Blur on enter key
      if (event.which === 13) {
       this.$(event.target).blur();
      }    
    });
  },
  isParameterSelection(){
    return !!this.get('parameters');
  },
  availableOptions: Ember.computed('parameters,searchQuery,value', function(){
    let availableOptions = Ember.A([]);
    if (this.get('parameters')){
      availableOptions = this.get('parameters').map(parameter => {
        return { title: parameter.title, value: parameter };
      });
    }
    else {
      availableOptions = this.get('searchQuery.parameter.options').map(option => {
        return { title: option, value: option };
      });
    }

    return availableOptions.filter(option => {
      return option.title.toLowerCase().includes(this.get('value').toLowerCase());
    });
  }),
  inputWidthObserver: Ember.observer('value', function() {
    this.setInputWidth(this.$('input'));
  }),
  setInputWidth(input){
    let tempDiv = this.$(`<div class="search-flow_temp-div" style="display:none">${this.get('value') || this.get('searchQuery.parameter.placeholder')}</div>`).appendTo('body');
    input.css('width', tempDiv.width() + 3); 
    tempDiv.remove();
  },
  actions: {
    selectOption(option){
      this.set('isFocused', false);
      if (this.isParameterSelection()){
        this.set('searchQuery.parameter', option);
      }
      else {
        this.set('value', option);
      }
      this.get('inputBlurred')(this.get('searchQuery'), this.isParameterSelection());
    }
  }
});
