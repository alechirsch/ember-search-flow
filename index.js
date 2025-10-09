'use strict';

module.exports = {
  name: require('./package').name,

  options: {
    '@embroider/macros': {
      setOwnConfig: {},
    },
  },

  included(app) {
    this._super.included.apply(this, arguments);
  },
};
