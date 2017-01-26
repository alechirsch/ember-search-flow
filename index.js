/* jshint node: true */
'use strict';

module.exports = {
  isDevelopingAddon: function() {
    return true;
  },
  options: {
    autoprefixer: {
      browsers: ['last 2 ios version'],
      cascade: false
    }
  },
  afterInstall: function() {
    return this.addAddonsToProject({
      packages: [
        {name: 'ember-cli-autoprefixer'}
      ]
    });
  },
  included: function(app) {
    app.import('app/styles/app.css');
  },
  name: 'ember-search-flow'
};
