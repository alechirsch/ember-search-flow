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
		remoteOptions: true
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
		onValueUpdated(value, parameter){
			Ember.set(parameter, 'options', this.currentModel.nameOptions.filter(option => {
				return option.toLowerCase().includes(value.toLowerCase());
			}));
		},
		onQueryUpdated(){
			//Ember.get(this.currentModel, 'query') is updated with value in search-flow's generateQuery
			return;
		},
		changeQuery(){
			Ember.set(this.currentModel, 'query', JSON.parse(this.currentModel.newQuery));
		},
		changeParameters(){
			Ember.set(this.currentModel, 'parameters', JSON.parse(this.currentModel.newParameters));
		}
	}
});
