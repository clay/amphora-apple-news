const _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  files = require('nymag-fs'),
  expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  FAKE_SITE_DIR = path.resolve(__dirname, './test/config/sites/mockSite');

describe(_.startCase(filename), function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  function mockContent() {
    return [
      {
        '_ref': 'some/component/uri1',
        role: 'title',
        text: 'This is a Story'
      },
      {
        '_ref': 'some/unrenderable/component',
        text: 'I contribute nothing to the discourse !!'
      },
      {
        '_ref': 'some/component/uri3',
        role: 'container',
        components: [
          {
            role: 'photo',
            URL: 'zoe.com/coolpic.jpg'
          },
          {
            role: 'caption',
            text: 'Photo: zoe\'s photo studio'
          },
          {
            '_ref': 'some/unrenderable/component',
            text: 'I should not be rendered for apple news!'
          },
          {
            role: 'section',
            components: [
              {
                '_ref': 'useless/thing'
              },
              {
                '_ref': 'useable/thing',
                role: 'body',
                text: 'hey there!'
              }
            ]
          }
        ]
      }
    ];
  }

  function mockCmpt() {
    return {
      '_ref': 'some/component/uri3',
      role: 'container',
      components: [
        {
          role: 'photo',
          URL: 'zoe.com/coolpic.jpg'
        },
        {
          '_ref': 'component/ref',
          role: 'caption',
          text: 'Photo: zoe\'s photo studio'
        },
        {
          '_ref': 'some/unrenderable/component',
          text: 'I should not be rendered for apple news!'
        },
        {
          role: 'section',
          components: [
            {
              '_ref': 'useless/thing'
            },
            {
              '_ref': 'useable/thing',
              role: 'body',
              text: 'hey there!'
            }
          ]
        }
      ]
    };
  }

  describe('getSiteConfig', function () {
    const data = { site: { dir: FAKE_SITE_DIR } },
      fn = lib[this.title];

    it('returns the site config yml as a js Object', function () {
      expect(fn(data.site)).to.eql({ language: 'en', version: '1.5', identifier: 'askdfghergmdslfajf' });
    });
  });

  describe('sanitizeComponent', function () {
    const data = mockCmpt(),
      fn = lib[this.title];

    it('returns a component without the _ref property', function () {
      expect(fn(data)).to.not.have.own.property('_ref');
    });
  });

  describe('render', function () {
    const fn = lib[this.title],
      site = { dir: FAKE_SITE_DIR };

    it('returns the article without a content array', function () {
      const data = Object.assign({}, { site }, { '_data': { content: [], title: 'Wow cool' } });

      expect(fn(data).output).to.not.have.own.property('content');
    });

    it('returns an article with the properties from the site config', function () {
      const data = { site };

      expect(fn(data).output).to.have.own.property('language');
    });

    it('includes a component if it has a "role" property', function () {
      const data = { site, '_data': { content: mockContent() } };

      expect(fn(data).output.components[0]).to.eql({
        role: 'title',
        text: 'This is a Story'
      });
    });

    it('does not include components without a "role" property', function () {
      const data = { site, '_data': { content: mockContent() } },
        { output } = fn(data);

      expect(_.filter(output.components, (cmpt) => !cmpt.role)).to.be.empty;
    });

    it('removes the "_ref" property from all included ANF components', function () {
      const data = { site, '_data': { content: mockContent() } },
        { output } = fn(data);

      expect(_.filter(output.components, (cmpt) => !!cmpt._ref)).to.be.empty;
    });

    it('sets the output type to "json"', function () {
      const data = { site, '_data': { content: mockContent() } };

      expect(fn(data).type).to.equal('json');
    });
  });

});
