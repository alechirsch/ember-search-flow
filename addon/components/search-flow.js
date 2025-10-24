import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { cached } from '@glimmer/tracking';
import { A, isArray } from '@ember/array';
import { action } from '@ember/object';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';
import layout from '../templates/components/search-flow';

class SearchFlowComponent extends Component {
  @tracked isSelectingParameter = false;
  @tracked queryGeneratedByComponent = false;
  @tracked didHitEnter = false;
  @tracked _manualFilters = null;
  @tracked _filterFocusTracker = 0; // Track filter focus changes

  get searchLabel() {
    return this.args.searchLabel || 'Add Filter';
  }

  get clearLabel() {
    return this.args.clearLabel || 'Clear Filters';
  }

  get maxFilters() {
    return this.args.maxFilters || null;
  }

  get defaultParameterValues() {
    return {
      allowMultiple: true,
      remoteOptions: false,
      contains: false,
      sort: true,
      suggested: false
    };
  }

  getParameter(parameter) {
    return this.args.parameters?.find(param => {
      return parameter.toLowerCase() === param.name.toLowerCase();
    });
  }

  // Reactively compute filters from the query
  get filters() {
    // If manually set filters exist, use those
    if (this._manualFilters) {
      return this._manualFilters;
    }

    // Otherwise, compute from query
    if (this.queryGeneratedByComponent) {
      return this._manualFilters || A([]);
    }
    
    if (!this.args.query || !this.args.parameters) {
      return A([]);
    }

    let filters = A([]);
    Object.keys(this.args.query).forEach(key => {
      let keys = [key];
      let isContains = false;
      if (key === 'contains') {
        keys = Object.keys(this.args.query.contains);
        isContains = true;
      }

      keys.forEach(key => {
        let values = this.args.query;
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
            filter.parameter = {
              ...this.defaultParameterValues,
              ...filter.parameter
            };
            filters.pushObject(filter);
          }
        });
      });
    });
    
    return filters;
  }

  set filters(value) {
    this._manualFilters = value;
  }

  get availableParameters() {
    if (!this.args.parameters) {
      return A([]);
    }
    
    // Use native filter instead of Ember's reject to ensure compatibility
    const filtered = this.args.parameters.filter(parameter => {
      // Keep parameters that have both name and title, and handle allowMultiple
      return parameter.name && parameter.title && 
        !(parameter.allowMultiple === false && this.filters.find(filter => {
          return filter?.parameter?.name === parameter.name;
        }));
    });
    
    return A(filtered);
  }

  get suggestedParameters() {
    // Use native filter instead of filterBy for compatibility
    return this.availableParameters.filter(param => param.suggested);
  }

  get canClearAll() {
    return this.filters.length > 1;
  }

  isParameterAvailable(parameter) {
    if (!parameter) {
      return true;
    }
    // Use native find instead of findBy for compatibility
    return this.availableParameters.find(p => p.name === parameter.name);
  }

  setOnQuery(isContains, query, path, value){
    if (isContains){
      query.contains[path] = value;
    }
    else {
      query[path] = value;
    }
  }

  getOnQuery(isContains, query, path){
    if (isContains){
      return query.contains[path];
    }
    return query[path];
  }

  generateQuery() {
    let query = {};
    this.filters.forEach(filter => {
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

    this.queryGeneratedByComponent = true;
    if (this.args.onQueryUpdated) {
      this.args.onQueryUpdated(query);
    }
  }

  get canAddNewFilter() {
    // Access _filterFocusTracker to ensure this getter reruns when focus changes
    this._filterFocusTracker;
    
    if (this.isSelectingParameter) {
      return false;
    }
    if (typeof this.maxFilters === 'number' && this.maxFilters <= this.filters.length){
      return false;
    }
    // Check if any filter has isFocused using plain JS
    return !this.filters.some(filter => filter.isFocused);
  }
  
  // Method to be called when filter focus changes
  @action
  notifyFilterFocusChange() {
    this._filterFocusTracker++;
  }

  @action
  newFilter(event) {
    if (event.which === 13) {
      this.didHitEnter = true;
    }
    this.isSelectingParameter = true;
  }

  @action
  newFilterWithParameter(parameter) {
    if (!this.isParameterAvailable(parameter)) {
      return;
    }
    let filter = {
      parameter: {
        ...this.defaultParameterValues,
        ...parameter
      },
      value: '',
    };
    // Create a new array with the additional filter
    let currentFilters = this.filters;
    this.filters = A([...currentFilters, filter]);
    this.isSelectingParameter = false;
    this.didHitEnter = false;
  }

  @action
  setParameterToFilter(parameter, filter) {
    filter.parameter = parameter;
  }

  @action
  clearFilters(){
    this.filters = A([]);
    this.generateQuery();
  }

  @action
  removeFilter(filterToRemove) {
    // Create a new array without the removed filter
    this.filters = A(this.filters.filter(f => f !== filterToRemove));
    this.generateQuery();
  }

  @action
  inputBlurred(isNewParameter, filter, shouldRemoveFilter) {
    if (isNewParameter) {
      this.isSelectingParameter = false;
      return;
    }

    if (!filter.value || shouldRemoveFilter) {
      // Create a new array without the removed filter
      this.filters = A(this.filters.filter(f => f !== filter));
    }
    this.generateQuery();
  }
}

export default setComponentTemplate(layout, SearchFlowComponent);
