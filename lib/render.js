'use strict';

const _ = require('lodash');

function render(data) {
  const article = Object.assign({}, data._data);

  article.components = [];
  article.version = '1.5';
  article.language = 'en';
  article.layout = {
    columns: 10,
    width: 1024,
    margin: 85,
    gutter: 20
  };

  /*
   * we only want to add components that have been formatted for apple news
   * the easiest way to tell this is if the component has a 'role' property
   * if the component doesn't have a role, check for the 'multi' property
   * some single clay components translate to multiple apple news components,
   * in this case the component's anf renderer returns an object with the multi prop
   * with an array of formatted anf components
   */

  _.forEach(article.content, (item) => {
    if (item.role) {
      article.components.push(_.omit(item, '_ref'));
    } else if (item.multi) {
      _.forEach(item.components, (cmpt) => article.components.push(cmpt));
    }
  });

  return {
    output: _.omit(article, 'content'),
    type: 'json'
  }
}

module.exports = render;
