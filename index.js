/* jshint node: true */
'use strict';

module.exports = {
  options: {
    autoprefixer: {
      browsers: ['last 2 versions']
    }
  },
  afterInstall: function() {
    return this.addAddonsToProject({
      packages: [
        {name: 'ember-cli-autoprefixer'}
      ]
    });
  },
  name: 'ember-search-flow'
};
