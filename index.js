'use strict';

const _ = require('lodash'),
  path = require('path'),
  files = require('nymag-fs');

function getSiteConfig(site) {
  const ymlPath = path.resolve(site.dir, 'anf.yml').replace('.yml', ''); // files.getYaml adds the file extension for some reason, so remove it here

  return files.getYaml(ymlPath);
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
    return;
  }
}

function render(data) {
  const article = Object.assign({}, _.omit(data._data, 'content'), getSiteConfig(data.site)),
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
    output: article,
    type: 'json'
  };
}

module.exports.render = render;

// for testing
module.exports.getSiteConfig = getSiteConfig;
module.exports.sanitizeComponent = sanitizeComponent;
