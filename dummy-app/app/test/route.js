import Ember from 'ember';

export default Ember.Route.extend({
	model(){
		return {
			query: {
				name: 'Bob'
			},
			parameters: [
				{
					name: 'name',
					title: 'Name',
					options: ['Bill', 'Bob', 'Sally', 'Sue'],
					type: 'contains',
					placeholder: 'Enter name',
					allowMultiple: true
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
	}
});
