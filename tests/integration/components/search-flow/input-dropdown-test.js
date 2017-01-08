import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('search-flow/input-dropdown', 'Integration | Component | search flow/input dropdown', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{search-flow/input-dropdown}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#search-flow/input-dropdown}}
      template block text
    {{/search-flow/input-dropdown}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
