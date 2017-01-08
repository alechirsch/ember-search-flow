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
  processQueries: Ember.observer('query', function() {
    if (this.get('queryGeneretedByComponent')){
      this.set('queryGeneretedByComponent', false);
      return;
    }
    let searchQueries = this.get('searchQueries');
    Object.keys(this.get('query')).forEach(key => {
      let parameter = this.getParameter(key);
      if(parameter){
        let searchQuery = Ember.Object.create({
          parameter,
          value: this.get(`query.${key}`)
        });
        searchQuery.parameters = Ember.assign({}, this.get('defaultParameterValues'), searchQuery.parameters);
        searchQueries.pushObject(searchQuery);
      }
    });
  }),
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
  generateQuery(){
    let query = {};
    this.get('searchQueries').forEach(searchQuery => {
      let queryItem = query[searchQuery.parameter.name];
      if (queryItem){
        if (!Ember.isArray(queryItem)){
          if (queryItem === searchQuery.value){
            return;
          }
          queryItem = [queryItem];
        }
        if (queryItem.includes(searchQuery.value)){
          return;
        }
        queryItem.push(searchQuery.value);
        query[searchQuery.parameter.name] = queryItem;
      }
      else {
        query[searchQuery.parameter.name] = searchQuery.value;
      }
    });

    this.set('queryGeneretedByComponent', true);
    this.set('query', query);
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
      this.generateQuery();
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
        this.generateQuery();
      }
    },
    inputFocused(){
      this.set('addingNewSearchQuery', true);
    }
  }
});