/* jshint node: true */
'use strict';

module.exports = {
  isDevelopingAddon: function() {
    return true;
  },
  included: function(app) {
    app.import('app/styles/app.css');
  },
  name: 'ember-search-flow'
};
