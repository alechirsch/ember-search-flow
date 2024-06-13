import Component from '@ember/component';
import layout from '../templates/components/search-flow';
import { A, isArray } from '@ember/array';
import { observer, computed } from '@ember/object';

export default Component.extend({
  layout,
  classNames: ['search-flow'],
  searchLabel: 'Add Filter',
  clearLabel: 'Clear Filters',
  maxFilters: null,
  defaultParameterValues: {
    allowMultiple: true,
    remoteOptions: false,
    contains: false,
    sort: true,
    suggested: false
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
  processQueries: observer('query', 'parameters', function () {
    if (this.get('queryGeneratedByComponent')) {
      this.set('queryGeneratedByComponent', false);
      return;
    }
    let filters = this.set('filters', A([]));
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
        if (!isArray(values)) {
          values = [values];
        }
        values.forEach(value => {
          let parameter = this.getParameter(key);
          if (parameter && (!isContains || (isContains && parameter.contains))) {
            let filter = {
              parameter,
              value
            };
            if (isContains){
              filter.isContains = true;
            }
            filter.parameters = {
					...this.get('defaultParameterValues'),
					...filter.parameters
				};
            filters.pushObject(filter);
          }
        });
      });
    });
  }),
  availableParameters: computed('parameters', 'filters.[]', 'filters.@each.parameter', 'parameters.@each.suggested', function () {
    return this.get('parameters').reject(parameter => {
      return !parameter.name || !parameter.title || (parameter.allowMultiple === false && this.get('filters').find(filter => {
        return filter?.parameter?.name === parameter.name;
      }));
    });
  }),
  suggestedParameters: computed('availableParameters', function(){
    return this.get('availableParameters').filterBy('suggested');
  }),
  canClearAll: computed('filters.[]', function (){
    return this.get('filters.length') > 1;
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
      if (filter.isContains && !query.contains) {
          query.contains = {};
      }
      let queryItem = this.getOnQuery(filter.isContains, query, queryPath);
      if (queryItem) {
        if (!isArray(queryItem)) {
          if (queryItem === filter.value) {
            return;
          }
          queryItem = [queryItem];
        }
        if (queryItem.includes(filter.value)) {
          return;
        }
        queryItem.push(filter.value);
        this.setOnQuery(filter.isContains, query, queryPath, queryItem);
      }
      else {
        this.setOnQuery(filter.isContains, query, queryPath, filter.value);
      }
    });

    this.set('queryGeneratedByComponent', true);
    this.set('query', query);
    if (this.get('onQueryUpdated')) {
      this.get('onQueryUpdated')(query);
    }
  },
  canAddNewFilter: computed('isSelectingParameter', 'filters.[]', 'filters.@each.isFocused', 'maxFilters', function () {
    if (this.get('isSelectingParameter')) {
      return false;
    }
    if (typeof this.get('maxFilters') === 'number' && this.get('maxFilters') <= this.get('filters.length')){
      return false;
    }
    return !this.get('filters').isAny('isFocused');
  }),
  actions: {
    newFilter(event) {
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
      let filter = {
        parameter,
        value: '',
      };
      filter.parameter = assign({}, this.get('defaultParameterValues'), filter.parameter);
      this.get('filters').pushObject(filter);
      this.set('isSelectingParameter', false);
    },
    setParameterToFilter(parameter, filter) {
      filter.parameter = parameter;
    },
    clearFilters(){
      this.set('filters', A([]));
      this.generateQuery();
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
