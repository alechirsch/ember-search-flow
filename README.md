# Ember-search-flow

[![Ember Observer Score](https://emberobserver.com/badges/ember-search-flow.svg)](https://emberobserver.com/addons/ember-search-flow)

This is a multi-faceted search component based on many of the "visual search" packages out there designed for Ember.
See the demo at [https://alechirsch.github.io/ember-search-flow/](https://alechirsch.github.io/ember-search-flow/)

## Compatibility

- Ember.js v4.12 or above (including Ember 5.x and 6.x)
- Ember CLI v4.12 or above
- Node.js v18 or above
- Modern browsers (last 2 versions)

## Installation

```bash
ember install ember-search-flow
```

## Upgrading from v3.x

If you're upgrading from v3.x, please see the [UPGRADE.md](UPGRADE.md) guide for breaking changes and migration instructions.

## Usage

Once installed, include the component in any template using angle bracket syntax:

```hbs
<SearchFlow
  @parameters={{this.parameters}}
  @query={{this.query}}
  @onQueryUpdated={{this.onQueryUpdated}}
  @onValueUpdated={{this.onValueUpdated}}
/>
```

### Component Arguments

Argument | Default Value | Description
---|---|---
`@searchLabel` | `'Add Filter'` | The text displayed next to the add filter button.
`@clearLabel` | `'Clear Filters'` | The text displayed next to the clear all filters button. By default, this button will not be displayed until two or more filters are added.
`@maxFilters` | `null` | The maximum number of filters allowed to be added by the user. This will not block the number of filters manually passed in through the query object. Any non-number value will be treated as infinite.
`@parameters` | (required) | Array of parameter objects defining available filters.
`@query` | (required) | The current query object.
`@onQueryUpdated` | `null` | Callback function called when query is updated.
`@onValueUpdated` | `null` | Callback function called when remote options need to be fetched.

### Query
The query is an object of filters that you can use in an ember store query
This is the output of the component, you can also use it to initialize the filters for the component.
For example, if you want to filter a list of users by the name "Bob" and age of "25", the query object will look like this
```
{
	name: "Bob",
	age: 25
}
```
A query for filtering by "Bob" or "Bill" AND age 25:
```
{
	name: ["Bob", "Bill"],
	age: 25
}
```

There is also an option to query on a partial string using the "contains" key in the query.
A query for filterting all on names that contain the letter "b":
```
{
	contains: {
		name: "b"
	}
}
```

### Parameters
Parameters is an array of objects that define what filters can be added to the query.
Each object in the array is defined with the following options

| Key | Required | Description |
|-------|----------|-------------|
| name | yes | The key of the filter in the query |
| title | yes | The text to be displayed for the name of filter. |
| placeholder | no | The displayed string for a parameter when no value is typed into the input box. |
| allowMultiple | no | Default is true. Setting to false will allow only one filter of this parameter in the query. |
| contains | no | Default is false. This enables a filter to use the 'contains' key in the query. |
| options | no | This is an array of strings that represents the available options for the parameter. || options | no | This is an array of strings that represents the available options for the parameter. |
| remoteOptions | no | Default is false. If set to true, the options are remotely obtained and the onValueUpdated action will be called whenever the value of an input changes. Refer to the section about the onValueUpdated action. |
| suggested | no | Default is false. Setting to true will place the filter into the suggested filters list. |
| sort | no | Default is true. Setting to false will not auto sort the options list. The sort is alphabetical. |

Here is an example of a parameter that does not use remote options and where a user can only input one of:
```
{
	name: 'status',
	title: 'Status',
	options: ['New', 'Open', 'Pending', 'Closed'],
	placeholder: 'Enter status',
	allowMultiple: false
}
```

### @onValueUpdated

This callback is called only if `remoteOptions` is set to true. Whenever a user changes the value of an input box, this function is called with two parameters:

- `value` - The value that was entered into the input box
- `parameter` - The parameter that was defined in the parameters array

This callback should set the 'options' on the parameter to an array of strings that are the available options.

```js
@action
onValueUpdated(value, parameter) {
  // do remote call
  let options = // results from remote call
  parameter.options = options;
}
```

Optionally, you can configure your Ember application to have Search Flow set a timeout prior to querying your resource for options to show. In your Ember environment file, export a Search Flow configuration like the following:

```js
'ember-search-flow': {
  optionsTimeout: 1000
}
```

This will make Search Flow wait one second after the user finishes typing before sending out requests for options to show. If you choose to use this timeout configuration you must change the return value of your `onValueUpdated` function to be a Promise of the array of options.

### @onQueryUpdated

This callback is called each time ember-search-flow makes a new query from a newly selected key-value pair. This enables you to listen and define behavior when filters are created or deleted.

```js
@action
onQueryUpdated(query) {
  this.routeFilter = query;
  // refresh the route, query is used by a this.store.query call to make JSONAPI call to a resource server
  this.refresh();
}
```

## Development

### Setup

```bash
git clone https://github.com/alechirsch/ember-search-flow.git
cd ember-search-flow
npm install
```

### Running Tests

```bash
npm test
```

### Running the Dummy App

```bash
npm start
```

Visit your app at [http://localhost:4200](http://localhost:4200).

### Linting

```bash
npm run lint
npm run lint:fix
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

For more information on using ember-cli, visit [https://cli.emberjs.com/](https://cli.emberjs.com/).
