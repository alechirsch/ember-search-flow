import Ember from 'ember';

let query = {
	name: ['Sue', 'Bob'],
	contains: {
		name: ['b', 'll']
	}
};

let parameters = [
	{
		name: 'name',
		title: 'Name',
		contains: true,
		placeholder: 'Enter name',
		remoteOptions: function(parameter){
			Ember.set(parameter, 'options', 'results of DB call');
		},

	},
	{
		name: 'status',
		title: 'Status',
		options: ['New', 'Open', 'Pending', 'Closed'],
		placeholder: 'Enter status',
		allowMultiple: false
	}
];

export default Ember.Route.extend({
	model(){
		return {
			query,
			nameOptions: ['Bill', 'Bob', 'Sally', 'Sue'],
			parameters,
			newQuery: JSON.stringify(query, null, '\t'),
			newParameters: JSON.stringify(parameters, null, '\t'),
		};
	},
	actions: {
		onValueUpdated(newValue, filter){
			filter.set('parameter.options', this.currentModel.nameOptions.filter(option => {
				return option.toLowerCase().includes(newValue.toLowerCase());
			}));
		},
		changeQuery(){
			Ember.set(this.currentModel, 'query', JSON.parse(this.currentModel.newQuery));
		},
		changeParameters(){
			Ember.set(this.currentModel, 'parameters', JSON.parse(this.currentModel.newParameters));
		}
	}
});
