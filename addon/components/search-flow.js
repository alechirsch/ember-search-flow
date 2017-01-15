import Ember from 'ember';
import layout from '../templates/components/search-flow';

export default Ember.Component.extend({
  layout,
  classNames: ['search-flow'],
  defaultParameterValues: {
    allowMultiple: true,
    remoteOptions: false
  },
  init() {
    this._super(...arguments);
    this.set('filters', Ember.A([]));
    this.processQueries(this.get('query'));
    this.set('newParameter', '');
    this.set('isSelectingParameter', false);
  },
  getParameter(parameter) {
    return this.get('parameters').find(param => {
      return parameter.toLowerCase() === param.name.toLowerCase();
    });
  },
  processQueries: Ember.observer('query', function () {
    if (this.get('queryGeneretedByComponent')) {
      this.set('queryGeneretedByComponent', false);
      return;
    }
    let filters = this.get('filters');
    /// THIS MUST BE REFACTORED
    Object.keys(this.get('query')).forEach(key => {
      if (key === 'contains') {
        Object.keys(this.get('query.contains')).forEach(key => {
          if (Ember.isArray(this.get(`query.contains.${key}`))) {
            this.get(`query.contains.${key}`).forEach(value => {
              let parameter = this.getParameter(key);
              if (parameter) {
                let filter = Ember.Object.create({
                  parameter: Ember.Object.create(parameter),
                  value,
                  isContains: true
                });
                filter.parameters = Ember.assign({}, this.get('defaultParameterValues'), filter.parameters);
                filters.pushObject(filter);
              }
            });
          }
          else {
            let parameter = this.getParameter(key);
            if (parameter) {
              let filter = Ember.Object.create({
                parameter: Ember.Object.create(parameter),
                value: this.get(`query.contains.${key}`),
                isContains: true
              });
              filter.parameters = Ember.assign({}, this.get('defaultParameterValues'), filter.parameters);
              filters.pushObject(filter);
            }
          }
        });
      }
      else {
        if (Ember.isArray(this.get(`query.${key}`))) {
          this.get(`query.${key}`).forEach(value => {
            let parameter = this.getParameter(key);
            if (parameter) {
              let filter = Ember.Object.create({
                parameter: Ember.Object.create(parameter),
                value
              });
              filter.parameters = Ember.assign({}, this.get('defaultParameterValues'), filter.parameters);
              filters.pushObject(filter);
            }
          });
        }
        else {
          let parameter = this.getParameter(key);
          if (parameter) {
            let filter = Ember.Object.create({
              parameter: Ember.Object.create(parameter),
              value: this.get(`query.${key}`)
            });
            filter.parameters = Ember.assign({}, this.get('defaultParameterValues'), filter.parameters);
            filters.pushObject(filter);
          }
        }
      }
    });
  }),
  availableParameters: Ember.computed('parameters,filters.[],filters.@each.parameter', function () {
    return this.get('parameters').reject(parameter => {
      return parameter.allowMultiple === false && this.get('filters').find(filter => {
        return filter.get('parameter.name') === parameter.name;
      });
    });
  }),
  isParameterAvailable(parameter) {
    if (!parameter) {
      return true;
    }
    return this.get('availableParameters').findBy('name', parameter.name);
  },
  generateQuery() {
    let query = {};
    this.get('filters').forEach(filter => {
      let queryPath = filter.parameter.name;
      if (filter.get('isContains')) {
        if (!query.contains) {
          query.contains = {};
        }
        queryPath = `contains.${queryPath}`;
      }
      let queryItem = Ember.get(query, queryPath);

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
        Ember.set(query, queryPath, queryItem);
      }
      else {
        Ember.set(query, queryPath, filter.value);
      }
    });

    this.set('queryGeneretedByComponent', true);
    this.set('query', query);
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
    inputBlurred(isNewParameter, filter) {
      if (isNewParameter) {
        this.set('isSelectingParameter', false);
        return;
      }

      if (!filter.value) {
        this.get('filters').removeObject(filter);
      }
      this.set('addingNewfilter', false);
      this.generateQuery();
    },
  }
});