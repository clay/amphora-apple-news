'use strict';

const _ = require('lodash'),
  path = require('path'),
  files = require('nymag-fs');

function getSiteConfig(site) {
  const ymlPath = path.resolve(site.dir, 'anf.yml').replace('.yml', ''); // files.getYaml adds the file extension for some reason, so remove it here

  return files.getYaml(ymlPath);
}

function render(data) {
  const article = Object.assign({}, _.omit(data._data, 'content'), getSiteConfig(data.site)),
    { content } = data._data || [];

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
    if (item.role) {
      article.components.push(_.omit(item, '_ref')); // remove the _ref prop that amphora adds, it isn't allowed in ANF
    } else if (item.multi) {
      _.forEach(item.components, (cmpt) => article.components.push(cmpt));
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
