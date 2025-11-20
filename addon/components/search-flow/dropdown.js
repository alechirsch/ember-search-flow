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
		// Notify parent component to update active option
		if (this.args.setActiveOption) {
			this.args.setActiveOption(option);
		}
	}

	@action 
	optionClicked(option, event) {
		// Stop propagation to prevent the wrapper click handler from re-focusing the input
		if (event && event.stopPropagation) {
			event.stopPropagation();
		}

		// First, set the hovered option as active so selectOption uses it
		if (this.args.setActiveOption) {
			this.args.setActiveOption(option);
		}
		
		if (this.args.selectOption) {
			// Call with no arguments, just like Enter key does
			this.args.selectOption();
		}
	}
}

export default setComponentTemplate(layout, DropdownComponent);
