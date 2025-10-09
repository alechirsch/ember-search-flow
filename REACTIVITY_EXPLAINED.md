# Reactivity in Ember Search Flow v4.0

## The Observer Problem

### Classic Components (v3.x)
```js
processQueries: observer('query', 'parameters', function () {
  // This automatically re-runs whenever query or parameters change
  let filters = A([]);
  // ... process query into filters
  this.set('filters', filters);
})
```

### Initial Glimmer Conversion (Problem)
```js
constructor() {
  super(...arguments);
  this.processQueries(); // ❌ Only runs once!
}

processQueries() {
  // This doesn't automatically re-run when args change
  this.filters = A([]);
}
```

## The Solution: `@cached` Getter

### Modern Approach (v4.0)
```js
import { cached } from '@glimmer/tracking';

@tracked _manualFilters = null;

@cached
get filters() {
  // ✅ Automatically re-runs when this.args.query or this.args.parameters change!
  if (this._manualFilters) {
    return this._manualFilters;
  }
  
  // Compute filters from this.args.query
  // Auto-tracking sees we access this.args.query and this.args.parameters
  return computedFilters;
}

set filters(value) {
  // When we manually set filters (add/remove), store in _manualFilters
  this._manualFilters = value;
}
```

## How It Works

### 1. **Auto-Tracking**
When the `filters` getter runs, Ember's auto-tracking system automatically tracks:
- `this.args.query` - Parent component's query object
- `this.args.parameters` - Parent component's parameters array
- `this._manualFilters` - Internal tracked property

### 2. **Reactivity Flow**

```
Parent updates @query
    ↓
Ember detects args.query changed
    ↓
Invalidates @cached getter
    ↓
Template re-renders, calls this.filters
    ↓
filters getter re-computes
    ↓
New filters displayed
```

### 3. **Manual Overrides**
When user adds/removes filters through the UI:
```js
@action
removeFilter(filterToRemove) {
  // Setting filters triggers the setter
  this.filters = A(this.filters.filter(f => f !== filterToRemove));
  // Now _manualFilters is set
  // generateQuery() updates parent's @query
  this.generateQuery();
}
```

## Key Differences from Observers

### Observers (Classic - Old)
```js
// ❌ Runs immediately on property change (eager)
// ❌ Can cause infinite loops
// ❌ Hard to reason about order of execution
// ❌ Not composable
processQueries: observer('query', 'parameters', function() {
  this.set('filters', ...);
})
```

### Cached Getters (Modern)
```js
// ✅ Runs lazily only when accessed (efficient)
// ✅ Memoized - cached until dependencies change
// ✅ Clear dependency tracking
// ✅ Fully composable with other getters
@cached
get filters() {
  return computeFromQuery(this.args.query);
}
```

## Benefits of This Approach

1. **Lazy Evaluation**: Only recomputes when `filters` is actually accessed
2. **Memoization**: Result is cached until dependencies change
3. **Clear Dependencies**: Auto-tracking makes dependencies explicit
4. **No Race Conditions**: Getters can't cause infinite loops
5. **Better Performance**: Ember batches and optimizes re-renders
6. **Predictable**: Runs in render phase, not immediately on change

## Example Usage

### Parent Component
```js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ParentComponent extends Component {
  @tracked query = { name: 'Bob' };
  
  @action
  updateQuery(newQuery) {
    // When this updates, SearchFlow's filters getter will automatically re-run
    this.query = newQuery;
  }
}
```

### Template
```hbs
<SearchFlow
  @query={{this.query}}
  @parameters={{this.parameters}}
  @onQueryUpdated={{this.updateQuery}}
/>
```

### What Happens
1. User types in SearchFlow
2. SearchFlow calls `onQueryUpdated` with new query
3. Parent sets `this.query = newQuery`
4. `@query` arg changes in SearchFlow
5. `filters` getter auto-invalidates
6. Template re-renders, calls `filters` getter
7. New filters computed and displayed

## Migration Notes

This change maintains **full backward compatibility** with the component's public API while modernizing the internal reactivity system. Users don't need to change how they use the component - it just works better!

## Additional Reading

- [Ember Auto-Tracking Guide](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/)
- [Glimmer Component API](https://api.emberjs.com/ember/release/modules/@glimmer%2Fcomponent)
- [cached decorator](https://api.emberjs.com/ember/release/functions/@glimmer%2Ftracking/cached)

