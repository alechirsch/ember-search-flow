/* jshint node: true */
'use strict';

module.exports = {
  afterInstall() {
    return this.addAddonsToProject({
      packages: [
        {name: 'ember-cli-autoprefixer'}
      ]
    });
  },
  name: 'ember-search-flow'
};
