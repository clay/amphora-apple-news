'use strict';

const _ = require('lodash'),
  path = require('path'),
  files = require('fs'),
  yml = require('js-yaml');

var log = require('./services/log').setup({ file: __filename });

function getSiteConfig(site) {
  const ymlPath = path.resolve(site.dir, 'anf.yml');

  try {
    const file = files.readFileSync(ymlPath, 'utf8');

    return yml.safeLoad(file); // files.getYaml adds the file extension for some reason, so remove it here
  } catch (e) {
    log('error', 'No anf.yml config file found for this site');
    throw new Error('No anf.yml config file found for this site');
  }
}

function sanitizeComponent(cmpt) {
  if (cmpt.role && !cmpt.components) { // base case: a component without nested children. return it without the _ref
    return _.omit(cmpt, '_ref');
  } else if (cmpt.components && cmpt.role) { // apple news "container" type component with nested children.
    // clean each of the children and return the parent with clean children & no _ref
    // also filters out children that aren't formatted for apple news
    cmpt.components = _.filter(_.map(cmpt.components, (c) => sanitizeComponent(c)), (clean) => !!clean);
    return _.omit(cmpt, '_ref');
  } else {
    log('warn', 'Component not formatted for apple news, skipping', cmpt);
    return;
  }
}

function render(data) {
  const article = Object.assign({}, _.omit(data._data, 'content')),
    siteConfig = getSiteConfig(data.site),
    content = _.get(data, '_data.content', []);
  let cmpt;

  article.components = [];

  _.forEach(content, (c) => {
    cmpt = sanitizeComponent(c);

    if (cmpt) {
      article.components.push(cmpt);
    }
  });

  return {
    output: Object.assign({}, article, siteConfig),
    type: 'json'
  };
}

module.exports.render = render;

// for testing
module.exports.getSiteConfig = getSiteConfig;
module.exports.sanitizeComponent = sanitizeComponent;
module.exports.setLog = (fakeLog) => { log = fakeLog };
