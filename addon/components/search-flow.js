import Ember from 'ember';
import layout from '../templates/components/search-flow';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow'],
  defaultParameterValues: {
    allowMultiple: true,
    remoteOptions: false,
    contains: false
  },
  init() {
    this._super(...arguments);
    this.processQueries();
    this.set('isSelectingParameter', false);
  },
  getParameter(parameter) {
    return this.get('parameters').find(param => {
      return parameter.toLowerCase() === param.name.toLowerCase();
    });
  },
  processQueries: Ember.observer('query,parameters', function () {
    if (this.get('queryGeneretedByComponent')) {
      this.set('queryGeneretedByComponent', false);
      return;
    }
    let filters = this.set('filters', Ember.A([]));
    Object.keys(this.get('query')).forEach(key => {
      let keys = [key];
      let isContains = false;
      if (key === 'contains') {
        keys = Object.keys(this.get('query.contains'));
        isContains = true;
      }

      keys.forEach(key => {
        let values = this.get('query');
        if (isContains){
          values = values['contains'];
        }
        values = values[key];
        if (!Ember.isArray(values)) {
          values = [values];
        }
        values.forEach(value => {
          let parameter = this.getParameter(key);
          if (parameter && (!isContains || (isContains && parameter.contains))) {
            let filter = Ember.Object.create({
              parameter: Ember.Object.create(parameter),
              value
            });
            if (isContains){
              filter.set('isContains', true);
            }
            filter.parameters = Ember.assign({}, this.get('defaultParameterValues'), filter.parameters);
            filters.pushObject(filter);
          }
        });
      });
    });
  }),
  availableParameters: Ember.computed('parameters,filters.[],filters.@each.parameter', function () {
    return this.get('parameters').reject(parameter => {
      return !parameter.name || !parameter.title || (parameter.allowMultiple === false && this.get('filters').find(filter => {
        return filter.get('parameter.name') === parameter.name;
      }));
    });
  }),
  isParameterAvailable(parameter) {
    if (!parameter) {
      return true;
    }
    return this.get('availableParameters').findBy('name', parameter.name);
  },
  setOnQuery(isContains, query, path, value){
    if (isContains){
      query.contains[path] = value;
    }
    else {
      query[path] = value;
    }
  },
  getOnQuery(isContains, query, path){
    if (isContains){
      return query.contains[path];
    }
    return query[path];
  },
  generateQuery() {
    let query = {};
    this.get('filters').forEach(filter => {
      let queryPath = filter.parameter.name;
      if (filter.get('isContains') && !query.contains) {
          query.contains = {};
      }
      let queryItem = this.getOnQuery(filter.get('isContains'), query, queryPath);
      if (queryItem) {
        if (!Ember.isArray(queryItem)) {
          if (queryItem === filter.value) {
            return;
          }
          queryItem = [queryItem];
        }
        if (queryItem.includes(filter.value)) {
          return;
        }
        queryItem.push(filter.value);
        this.setOnQuery(filter.get('isContains'), query, queryPath, queryItem);
      }
      else {
        this.setOnQuery(filter.get('isContains'), query, queryPath, filter.value);
      }
    });

    this.set('queryGeneretedByComponent', true);
    this.set('query', query);
    if (this.get('onQueryUpdated')) {
      this.get('onQueryUpdated')(query);
    }
  },
  canAddNewFilter: Ember.computed('isSelectingParameter,filters.[],filters.@each.isFocused', function () {
    if (this.get('isSelectingParameter')) {
      return false;
    }
    return !this.get('filters').isAny('isFocused');
  }),
  actions: {
    newFilter() {
      if (event.which === 13) { // Enter key
        // Must prevent the filter from auto selecting an option
        this.set('didHitEnter', true);
      }
      this.set('isSelectingParameter', true);
    },
    newFilterWithParameter(parameter) {
      if (!this.isParameterAvailable(parameter)) {
        return;
      }
      let filter = Ember.Object.create({
        parameter: Ember.Object.create(parameter),
        value: '',
      });
      filter.parameter = Ember.assign({}, this.get('defaultParameterValues'), filter.parameter);
      this.get('filters').pushObject(filter);
      this.set('isSelectingParameter', false);
    },
    setParameterToFilter(parameter, filter) {
      filter.set('parameter', Ember.Object.create(parameter));
    },
    removeFilter(query) {
      this.get('filters').removeObject(query);
      this.generateQuery();
    },
    inputBlurred(isNewParameter, filter, shouldRemoveFilter) {
      if (isNewParameter) {
        this.set('isSelectingParameter', false);
        return;
      }

      if (!filter.value || shouldRemoveFilter) {
        this.get('filters').removeObject(filter);
      }
      this.set('addingNewfilter', false);
      this.generateQuery();
    },
  }
});