import Component from '@ember/component';
import { computed } from '@ember/computed';
import { set } from '@ember/object';
import layout from '../../templates/components/search-flow/dropdown';

export default Component.extend({
  layout,
  classNames: ['search-flow_dropdown__bg'],
  hasNoOption: computed('options', function(){
    return this.get('options.length') === 0;
  }),
  actions: {
    optionHovered(option){
      this.set('activeOption.isActive', false);
      set(option, 'isActive', true);
    },
    optionClicked(){
      this.get('selectOption')();
    }
  }
});
