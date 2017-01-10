import Ember from 'ember';

export default Ember.Route.extend({
	model(){
		return {
			query: {
				name: 'Bob'
			},
			nameOptions: ['Bill', 'Bob', 'Sally', 'Sue'],
			parameters: [
				{
					name: 'name',
					title: 'Name',
					type: 'contains',
					placeholder: 'Enter name',
					allowMultiple: true,
					remoteOptions: true,
				},
				{
					name: 'status',
					title: 'Status',
					options: ['New', 'Open', 'Pending', 'Closed'],
					type: 'contains',
					placeholder: 'Enter status',
					allowMultiple: false
				}
			]
		};
	},
	actions: {
		searchFlowValueUpdated(searchQuery){
			searchQuery.set('parameter.options', this.currentModel.nameOptions.filter(option => {
				return option.toLowerCase().includes(searchQuery.get('value').toLowerCase());
			}));
		}
	}
});
