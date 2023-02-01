import Component from '@ember/component';
import { set, computed, action } from '@ember/object';
import layout from '../../templates/components/search-flow/dropdown';
import { classNames, layout as templateLayout } from '@ember-decorators/component';

@templateLayout(layout)
@classNames('search-flow_dropdown__bg')
export default class Dropdown extends Component {
  @computed('options')
  get hasNoOption() {
    return this.get('options.length') === 0;
  }

  @action optionHovered(option){
    this.set('activeOption.isActive', false);
    set(option, 'isActive', true);
  }
  @action optionClicked(){
    this.get('selectOption')();
  }
}
