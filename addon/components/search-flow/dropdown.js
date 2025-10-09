import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class DropdownComponent extends Component {
  get hasNoOption() {
    return this.args.options?.length === 0;
  }

  @action 
  optionHovered(option){
    if (this.args.activeOption) {
      this.args.activeOption.isActive = false;
    }
    option.isActive = true;
  }

  @action 
  optionClicked(){
    if (this.args.selectOption) {
      this.args.selectOption();
    }
  }
}
