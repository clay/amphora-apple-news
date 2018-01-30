'use strict';

const _ = require('lodash'),
  path = require('path'),
  files = require('nymag-fs');

function getSiteConfig(site) {
  const ymlPath = path.resolve(site.dir, 'anf.yml').replace('.yml', ''); // files.getYaml adds the file extension for some reason, so remove it here

  return files.getYaml(ymlPath);
}

function cleanComponent(cmpt) {
  if (!cmpt.role && !cmpt.multi) {
    return;
  }

  if (cmpt.role && !cmpt.components) { // base case: a component without nested children. return it without the _ref
    return _.omit(cmpt, '_ref');
  } else if (cmpt.components && cmpt.role) { // apple news "container" type component with nested children.
    // clean each of the children and return the parent with clean children & no _ref
    // also filters out children that aren't formatted for apple news
    cmpt.components = _.filter(_.map(cmpt.components, (c) => cleanComponent(c)), (clean) => !!clean);
    return _.omit(cmpt, '_ref');
  } else if (cmpt.components && cmpt.multi) { // clay "multi" type component with nested children
    // return an array of the cleaned children, ignore & omit the parent in this case
    return _.forEach(cmpt.components, (c) => cleanComponent(c));
  } else {

  }
}

function render(data) {
  const article = Object.assign({}, _.omit(data._data, 'content'), getSiteConfig(data.site)),
    { content } = data._data || [];
  let curCmpt;

  article.components = [];

  /*
   * we only want to add components that have been formatted for apple news
   * the easiest way to tell this is if the component has a 'role' property
   * if the component doesn't have a role, check for the 'multi' property
   * some single clay components translate to multiple apple news components,
   * in this case the component's anf renderer returns an object with the multi prop
   * with an array of formatted anf components
   */

  _.forEach(content, (item) => {
    curCmpt = cleanComponent(item);

    if (_.isArray(curCmpt)) { // item is a clay multi component, push each of its children
      _.forEach(curCmpt, (c) => article.components.push(c));
    } else if (curCmpt && curCmpt.role) { // item is a single component or ANF container-type component
      article.components.push(curCmpt);
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
module.exports.cleanComponent = cleanComponent;
