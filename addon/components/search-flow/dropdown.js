import Ember from 'ember';
import layout from '../../templates/components/search-flow/dropdown';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow_dropdown'],
  hasNoOption: Ember.computed('options', function(){
    return this.get('options.length') === 0;
  }),
  actions: {
    optionHovered(option){
      this.set('activeOption.isActive', false);
      Ember.set(option, 'isActive', true);
    },
    optionClicked(){
      this.get('selectOption')();
    }
  }
});
