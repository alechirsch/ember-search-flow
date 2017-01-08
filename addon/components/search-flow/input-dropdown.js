import Ember from 'ember';
import layout from '../../templates/components/search-flow/input-dropdown';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_input-dropdown'],
  init(){
    this._super(...arguments);
    this.set('placeholder', this.get('searchQuery.parameter.placeholder') || '');
  },
  didInsertElement(){
    let input = this.$('input');
    if (!this.get('value')){
      input.focus();
    } 
    this.setInputWidth(input);
    
    input.on('blur', () => {
      this.get('inputBlurred')(this.get('searchQuery'));
    }).on('focus', () => {
      this.get('inputFocused')();
    }).on('keypress', event => {
      // Blur on enter key
      if (event.which == 13) {
       this.$(event.target).blur();
      }    
    });
  },
  inputWidthObserver: Ember.observer('value', function() {
    this.setInputWidth(this.$('input'));
  }),
  setInputWidth(input){
    let tempDiv = this.$(`<div class="search-flow_temp-div" style="display:none">${this.get('value') || this.get('searchQuery.parameter.placeholder')}</div>`).appendTo('body');
    input.css('width', tempDiv.width() + 1); 
    tempDiv.remove();
  }
});
