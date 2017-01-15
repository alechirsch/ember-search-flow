import Ember from 'ember';

export default Ember.Route.extend({
	model(){
		return {
			query: {
				name: ['Sue', 'Bob'],
				contains: {
					name: ['b', 'll']
				}
			},
			nameOptions: ['Bill', 'Bob', 'Sally', 'Sue'],
			parameters: [
				{
					name: 'name',
					title: 'Name',
					contains: true,
					placeholder: 'Enter name',
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
		searchFlowValueUpdated(filter){
			filter.set('parameter.options', this.currentModel.nameOptions.filter(option => {
				return option.toLowerCase().includes(filter.get('value').toLowerCase());
			}));
		}
	}
});
