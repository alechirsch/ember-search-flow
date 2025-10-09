# Upgrade Guide to v4.0.0 (Ember 6 Compatible)

## Breaking Changes

### Ember Version Support
- **Minimum Ember version**: 4.12 LTS
- **Recommended Ember version**: 5.4 LTS or 6.4 (latest)
- **Fully compatible with Ember 6.x**
- **Node version**: 18+ required

### Component Architecture
All components have been migrated from classic Ember components to Glimmer components:

#### Before (v3.x):
```hbs
{{search-flow
  parameters=parameters
  query=query
  onQueryUpdated=(action "updateQuery")
}}
```

#### After (v4.x):
```hbs
<SearchFlow
  @parameters={{this.parameters}}
  @query={{this.query}}
  @onQueryUpdated={{this.updateQuery}}
/>
```

### API Changes

#### Arguments (formerly properties)
All component arguments now use `@` notation:
- `parameters` → `@parameters`
- `query` → `@query`
- `searchLabel` → `@searchLabel`
- `clearLabel` → `@clearLabel`
- `maxFilters` → `@maxFilters`
- `onQueryUpdated` → `@onQueryUpdated`
- `onValueUpdated` → `@onValueUpdated`

#### Actions
Actions are now passed as functions, not using the `action` helper:

Before:
```hbs
{{search-flow
  onQueryUpdated=(action "updateQuery")
}}
```

After:
```hbs
<SearchFlow
  @onQueryUpdated={{this.updateQuery}}
/>
```

### Template Syntax
- Replaced `{{action}}` with `{{on "click"}}` and `{{fn}}`
- Added `role="button"` to clickable elements for accessibility
- Using angle bracket invocation throughout

### Dependency Updates
- Removed `ember-decorators` (using native decorators)
- Updated to modern Ember CLI structure
- Added Embroider compatibility
- Updated to use Glimmer components and tracked properties

## Migration Steps

1. **Update your Ember app** to at least version 4.12 LTS
2. **Update Node.js** to version 18 or higher
3. **Update package.json**:
   ```bash
   npm install ember-search-flow@^4.0.0
   # or
   yarn add ember-search-flow@^4.0.0
   ```
4. **Update component invocations** to use angle bracket syntax
5. **Update action handlers** to pass functions directly instead of using `action` helper
6. **Test thoroughly** - especially custom callbacks and data flow

## New Features

- Full Glimmer component support
- Better TypeScript support
- Embroider compatible
- Improved accessibility with role attributes
- Modern Ember patterns throughout

## Still Need Help?

If you encounter issues during migration, please open an issue on GitHub with:
- Your current Ember version
- Example of your search-flow usage
- Any error messages you're seeing

