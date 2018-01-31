'use strict';

const clayLog = require('clay-log'),
  pkg = require('../package.json');
var amphoraAppleNewsLogInstance;

/**
 * Initialize the logger
 */
function init() {
  if (amphoraAppleNewsLogInstance) {
    return;
  }

  // Initialize the logger
  clayLog.init({
    name: 'amphora-apple-news',
    prettyPrint: true,
    meta: {
      amphoraSearchVersion: pkg.version
    }
  });

  // Store the instance
  amphoraAppleNewsLogInstance = clayLog.getLogger();
}

/**
 * Setup new logger for a file
 *
 * @param  {Object} meta
 * @return {Function}
 */
function setup(meta = {}) {
  return clayLog.meta(meta, amphoraAppleNewsLogInstance);
}

/**
 * Set the logger instance
 * @param {Object|Function} replacement
 */
function setLogger(replacement) {
  amphoraAppleNewsLogInstance = replacement;
}

// Setup on first require
init();

module.exports.init = init;
module.exports.setup = setup;
module.exports.setLogger = setLogger;

