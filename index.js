'use strict';

const _ = require('lodash'),
  path = require('path'),
  files = require('fs'),
  yml = require('js-yaml');

var log = require('./services/log').setup({ file: __filename });

/**
 * readFile
 *
 * memoizes function that reads and translates YAML file
 *
 * @param {String} filePath
 * @returns {Object} yml file's contents as a Javascript object
 */
const loadYml = _.memoize(function readFile(filePath) {
  try {
    const file = files.readFileSync(filePath, 'utf8');

    return yml.safeLoad(file); // files.getYaml adds the file extension for some reason, so remove it here
  } catch (e) {
    const err = new Error('No anf.yml config file found for this site');

    log('error', err.message);
    throw err;
  }
});

/**
 * getSiteConfig
 *
 * gets anf.yml configuration file from the site's directory
 *
 * @param {Object} site
 * @returns {Object} JS Object from site's anf.yml file
 */
function getSiteConfig(site) {
  const ymlPath = path.resolve(site.dir, 'anf.yml');

  return loadYml(ymlPath);
}

/**
 * sanitizeComponent
 *
 * recursively iterates through a component and its `components` (if any)
 * and removes disallowed properties and unrenderable components from lists
 * logs a warning when a component is removed from the output
 *
 * @param {Object} cmpt component to be sanitized
 * @returns {Object} Sanitized component
 */
function sanitizeComponent(cmpt) {
  if (cmpt.role && !cmpt.components) { // base case: a component without nested children. return it without the _ref
    return _.omit(cmpt, '_ref');
  } else if (cmpt.components && cmpt.role) { // apple news "container" type component with nested children.
    // clean each of the children and return the parent with clean children & no _ref
    // also filters out children that aren't formatted for apple news
    cmpt.components = _.filter(_.map(cmpt.components, (c) => sanitizeComponent(c)), (clean) => !!clean);
    return _.omit(cmpt, '_ref');
  } else {
    log('warn', 'Component not formatted for apple news, skipping', { name: _.get(cmpt, '_ref', 'unknown') });
    return;
  }
}

/**
 * render
 *
 * formats a component for Apple News
 *
 * @param {Object} data
 * @returns {Object} Component rendered for Apple News Format
 */
function render(data, res) {
  const output = Object.assign({}, _.omit(data._data, ['content', '_ref'])),
    content = _.get(data, '_data.content') || _.get(data, '_data.components');
  let cmpt;

  output.components = [];

  _.forEach(content, (c) => {
    cmpt = sanitizeComponent(c);

    if (cmpt) {
      output.components.push(cmpt);
    }
  });

  if (_.get(data, 'locals.query.config', false)) {
    _.assign(output, getSiteConfig(data.site));
    output.siteSlug = data.site.slug;
  }

  res.json(output);
}

module.exports.render = render;

// for testing
module.exports.getSiteConfig = getSiteConfig;
module.exports.sanitizeComponent = sanitizeComponent;
module.exports.setLog = (fakeLog) => { log = fakeLog };
