# Amphora Apple News

[![Coverage Status](https://coveralls.io/repos/github/clay/amphora-apple-news/badge.svg)](https://coveralls.io/github/clay/amphora-apple-news) [![CircleCI](https://circleci.com/gh/clay/amphora-apple-news.svg?style=svg)](https://circleci.com/gh/clay/amphora-apple-news)

The [Apple News Format](https://developer.apple.com/library/content/documentation/General/Conceptual/Apple_News_Format_Ref/index.html#//apple_ref/doc/uid/TP40015408-CH79-SW1) renderer for Clay components.

## Install
`$ npm install --save amphora-apple-news`

## Integration

### Basic Configuration

First, ensure that you have a compatible version of Amphora installed (v3.x or greater) and require `amphora-apple-news` from wherever you are running Amphora.

```javascript
const amphoraAppleNews = require('amphora-apple-news');
```

Next, you'll need to register the Apple News renderer with your Amphora instance. This will tell Amphora to use the Apple News renderer whenever a component or page is requested with the `.anf` (Apple News Format) extension.

```javascript
return amphora({
  app: app,
  renderers: {
    anf: amphoraAppleNews,
    html: amphoraHtml,
    default: 'html'
  },
  providers: ['apikey', amphoraProvider],
  sessionStore: redisStore,
  plugins: [
    amphoraSearch
  ]
});
```

### Component Rendering

To make a Clay component renderable for Apple News Format, add a `anf.model.js` file to your component's directory. This file's default export should be a function that returns a javascript object that Apple News can ingest. All Apple News-specific data transforms should happen in this file. The exported function's signature should be the same as any other model.js render function, it will be called by Amphora with the component's `ref`, `data`, and the site's `locals`. Refer to the [Apple News Format Component Documentation](https://developer.apple.com/library/content/documentation/General/Conceptual/Apple_News_Format_Ref/Component.html#//apple_ref/doc/uid/TP40015408-CH5-SW1) for more information on the structuring of Apple News components.

Here is an example of a simple `anf.model.js` file for the `clay-paragraph` component. This file transforms the `clay-paragraph` component into an [Apple News Format Body component](https://developer.apple.com/library/content/documentation/General/Conceptual/Apple_News_Format_Ref/Body.html#//apple_ref/doc/uid/TP40015408-CH9-SW1).

```javascript
module.exports = function (ref, data, locals) {
  return {
    role: 'body',
    text: data.text,
    format: 'html'
  };
};
```

All Apple News components must include a `role` property, which tells Apple News what type of component to render. The Amphora Apple News Renderer will not render a component without a `role` property.

### Top-Level Component

This renderer was designed to consume a component that embeds other components in an array called `content`. It will not work correctly for a component that does not have a `content` array. Amphora will render components from the deepest level up, which makes it easy to render articles' component lists. For example, if a Clay `article` component is used as the highest level component to be rendered by Apple News, all items in the article's `content` component list will be rendered for Apple News before the article, that way the article can add `title`, `byline`, and other `heading` components to the top of its content list as well as set page metadata for Apple News before hitting the Amphora Apple News renderer. The renderer can then transform the article's `content` list into the correctly formatted `components` list that Apple News expects. The renderer will also add site-specific configuration, style, and layout properties to the article, specified in an anf.yml file in your site's directory.

### Site-Specific Configuration

Amphora Apple News will look for an `anf.yml` file in your site's directory that should include all of the applicable [Top-Level Properties](https://developer.apple.com/library/content/documentation/General/Conceptual/Apple_News_Format_Ref/Properties.html#//apple_ref/doc/uid/TP40015408-CH2-SW1) needed to render a page in Apple News Format. This should include component styles, layouts, metadata, etc. Amphora Apple News will transform the YML in this file to a javascript object and assign it to the top level of its output. An example anf.yml file should look like this:

```yml
version: '1.5'
language: en
layout:
  columns: 10
  width: 1024
  margin: 85
  gutter: 20
componentTextStyles:
  default:
    fontName: Georgia
    textColor: '#111'
    linkStyle:
      textColor: '#1782a9'
  default-body:
    fontSize: 17
    lineHeight: 27
  bigRedTextStyle:
    fontSize: 72
    textColor: '#FF0000'
componentLayouts:
  bodyContentLayout:
    columnStart: 0
    columnSpan: 7
    margin:
      bottom: 20
```

Layout and style names should be specified in the component they're meant to affect. This means that a Clay component that you'd like to have the `bigRedTextStyle` styles should be exported from its anf.model.js file like this:

```javascript
module.exports = function (ref, data, locals) {
  return {
    role: 'heading1',
    text: data.text,
    format: 'html',
    textStyle: 'bigRedTextStyle'
  };
};
```

## Contributing
Want a feature or find a bug? Create an issue or a PR and someone will get on it.
