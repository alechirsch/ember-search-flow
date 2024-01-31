import { isHTMLSafe } from '@ember/template';

const ESCAPE = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const BAD_CHARS = /[&<>"'`=]/g;
const POSSIBLE = /[&<>"'`=]/;

let escapeChar = function(chr) {
  return ESCAPE[chr];
};

// borrowed from Handlebars.utils.escapeexpression
// https://github.com/emberjs/ember.js/pull/18791
let escapeExpression = function(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && isHTMLSafe(string)) {
      return string.toHTML(); // private API, since SafeString isn't public
    } else if (string === null) {
      return '';
    } else if (!string) {
      return String(string);
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = String(string);
  }

  if (!POSSIBLE.test(string)) {
    return string;
  }

  return string.replace(BAD_CHARS, escapeChar);
};

export { escapeExpression as escape };