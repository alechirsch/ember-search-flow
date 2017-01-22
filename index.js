/* jshint node: true */
'use strict';

module.exports = {
  included: function(app) {
    app.import('app/styles/app.css');
  },
  name: 'ember-search-flow'
};
