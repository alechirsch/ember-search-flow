import Component from '@glimmer/component';
import { action } from '@ember/object';
import { setComponentTemplate } from '@ember/component';
import layout from '../../templates/components/search-flow/dropdown';

class DropdownComponent extends Component {
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
  optionClicked(option) {
    if (this.args.selectOption) {
      // Pass the clicked option directly to selectOption
      this.args.selectOption(option);
    }
  }
}

export default setComponentTemplate(layout, DropdownComponent);
