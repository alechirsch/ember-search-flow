import Ember from 'ember';
import layout from '../templates/components/search-flow';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow'],
  defaultParameterValues: {
    allowMultiple: true
  },
  init(){
    this._super(...arguments);
    this.set('searchQueries', Ember.A([]));
    this.processQueries(this.get('query'));
    this.set('newParameter', '');
    this.set('addingNewSearchQuery', false);
  },
  getParameter(parameter){
    return this.get('parameters').find(param => {
      return parameter.toLowerCase() === param.name.toLowerCase();
    });
  },
  processQueries(query){
    let searchQueries = this.get('searchQueries');
    Object.keys(query).forEach(key => {
      let parameter = this.getParameter(key);
      if(parameter){
        let searchQuery = Ember.Object.create({
          parameter,
          value: query[key]
        });
        searchQuery.parameters = Ember.assign({}, this.get('defaultParameterValues'), searchQuery.parameters);
        searchQueries.pushObject(searchQuery);
      }
    });
  },
  availableParameters: Ember.computed('parameters,searchQueries.[],searchQueries.@each.parameter', function(){
    return this.get('parameters').reject(parameter => {
      return parameter.allowMultiple === false && this.get('searchQueries').find(searchQuery => { 
        return searchQuery.get('parameter.name') === parameter.name;
      });
    });
  }),
  isParameterAvailable(parameter){
    if(!parameter){
      return true;
    }
    return this.get('availableParameters').findBy('name', parameter.name);
  },
  actions: {
    newSearchQuery(){
      let searchQuery = Ember.Object.create({
        value: ''
      });
      this.get('searchQueries').pushObject(searchQuery);
      this.set('newParameter', '');
      this.set('addingNewSearchQuery', true);
    },
    newSearchQueryWithParameter(parameter){
      if(!this.isParameterAvailable(parameter)){
        return;
      }
      let searchQuery = Ember.Object.create({
        parameter,
        value: '',
      });
      searchQuery.parameter = Ember.assign({}, this.get('defaultParameterValues'), searchQuery.parameter);
      this.get('searchQueries').pushObject(searchQuery);
      this.set('addingNewSearchQuery', true);
    },
    setParameterToQuery(parameter, searchQuery){
      searchQuery.set('parameter', parameter);
    },
    setValueToQuery(value, searchQuery){
      searchQuery.set('value', value);
      this.set('addingNewSearchQuery', false);
    },
    removeSearchQuery(query){
      this.get('searchQueries').removeObject(query);
    },
    inputBlurred(searchQuery, isNewParameter){
      if(!searchQuery){
        return;
      }
      
      if(!isNewParameter){
        if (!searchQuery.value){
          this.get('searchQueries').removeObject(searchQuery);
        }
        this.set('addingNewSearchQuery', false);
      }
    },
    inputFocused(){
      this.set('addingNewSearchQuery', true);
    }
  }
});