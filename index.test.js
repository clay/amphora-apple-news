'use strict';

const _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
  fs = require('fs'),
  FAKE_SITE_DIR = path.resolve(__dirname, './test/config/sites/mockSite');

describe(_.startCase(filename), function () {
  let sandbox,
    logFn;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    logFn = sandbox.spy();
    lib.setLog(logFn);
  });

  afterEach(function () {
    sandbox.restore();
  });

  function mockRes(box) {
    return {
      json: box.spy()
    };
  }

  function mockContent() {
    return [
      {
        _ref: 'some/component/uri1',
        role: 'title',
        text: 'This is a Story'
      },
      {
        _ref: 'some/unrenderable/component',
        text: 'I contribute nothing to the discourse !!'
      },
      {
        _ref: 'some/component/uri3',
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
            _ref: 'some/unrenderable/component',
            text: 'I should not be rendered for apple news!'
          },
          {
            role: 'section',
            components: [
              {
                _ref: 'useless/thing'
              },
              {
                _ref: 'useable/thing',
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
      _ref: 'some/component/uri3',
      role: 'container',
      components: [
        {
          role: 'photo',
          URL: 'zoe.com/coolpic.jpg'
        },
        {
          _ref: 'component/ref',
          role: 'caption',
          text: 'Photo: zoe\'s photo studio'
        },
        {
          _ref: 'some/unrenderable/component',
          text: 'I should not be rendered for apple news!'
        },
        {
          role: 'section',
          components: [
            {
              _ref: 'useless/thing'
            },
            {
              _ref: 'useable/thing',
              role: 'body',
              text: 'hey there!'
            }
          ]
        }
      ]
    };
  }

  function getArgs(spy) {
    return spy.getCall(0).args;
  }

  describe('getSiteConfig', function () {
    const data = { site: { dir: FAKE_SITE_DIR, slug: 'verygoodsite' } },
      fn = lib[this.title];

    it('returns the site config yml as a js Object', function () {
      expect(fn(data.site)).to.eql({ language: 'en', version: '1.5', identifier: 'askdfghergmdslfajf' });
    });

    it('throws an error if site path does not have an anf.yml file', function () {
      expect(() => {
        fn({dir: 'the/wrong/path'});
      }).to.throw();
      sinon.assert.calledOnce(logFn);
      sinon.assert.calledWith(logFn, 'error');
    });
  });

  describe('sanitizeComponent', function () {
    const data = mockCmpt(),
      fn = lib[this.title];

    it('returns a component without the _ref property', function () {
      expect(fn(data)).to.not.have.own.property('_ref');
    });

    it('correctly sanitizes components with nested component lists', function () {
      const sanitized = {
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
            role: 'section',
            components: [
              {
                role: 'body',
                text: 'hey there!'
              }
            ]
          }
        ]
      };

      expect(fn(data)).to.eql(sanitized);
    });
  });

  describe('render', function () {
    const fn = lib[this.title],
      site = { dir: FAKE_SITE_DIR },
      meta = { locals: { site } },
      metaWithQuery = { locals: { site, query: { config: true } } };

    it('responds with json', function () {
      const res = mockRes(sandbox);

      fn(mockContent(), meta, res);

      sinon.assert.calledOnce(res.json);
    });

    it('returns an article without a content array', function () {
      const res = mockRes(sandbox);

      fn({ content: [], title: 'Wow cool' }, meta, res);
      sinon.assert.calledWith(res.json, { components: [], title: 'Wow cool' });
    });

    it('returns an article with the properties from the site config if the request has the "config" query param', function () {
      const res = mockRes(sandbox);

      fn({ content: mockContent() }, metaWithQuery, res);
      expect(getArgs(res.json)[0]).to.have.own.property('language');
    });

    it('returns an article with the site slug if the request has the "config" query param', function () {
      const res = mockRes(sandbox);

      fn({ content: mockContent() }, metaWithQuery, res);
      expect(getArgs(res.json)[0]).to.have.own.property('siteSlug');
    });

    it('includes a component if it has a "role" property', function () {
      const res = mockRes(sandbox);

      fn({ content: mockContent() }, meta, res);
      expect(getArgs(res.json)[0].components[0]).to.eql({
        role: 'title',
        text: 'This is a Story'
      });
    });

    it('does not include components without a "role" property', function () {
      const res = mockRes(sandbox);

      fn({ content: mockContent() }, meta, res);

      expect(_.filter(getArgs(res.json)[0].components, (cmpt) => !cmpt.role)).to.be.empty;
      sinon.assert.calledThrice(logFn);
    });

    it('removes the "_ref" property from all included ANF components', function () {
      const res = mockRes(sandbox);

      fn({ content: mockContent() }, meta, res);
      expect(_.filter(getArgs(res.json)[0].components, (cmpt) => !!cmpt._ref)).to.be.empty;
    });

    it('does not render the site config if the request does not have the "config" query param', function () {
      const res = mockRes(sandbox);

      fn(mockCmpt(), meta, res);
      expect(getArgs(res.json)[0]).to.not.have.own.property('language');
    });

    it('replaces the site dir if the request has a "config" and "replacement" query param', function () {
      const res = mockRes(sandbox);

      metaWithQuery.locals.query.replacement = 'foo';
      metaWithQuery.locals.site.slug = 'bar';

      fn(mockCmpt(), metaWithQuery, res);
      expect(getArgs(res.json)[0]).to.have.own.property('siteSlug');
    });

  });

  describe.only('getSitePathBySlug', function () {
    const fn = lib[this.title];

    beforeEach(function () {
      sandbox.stub(fs, 'existsSync');
      sandbox.stub(path, 'resolve');

      fs.existsSync.returns(false);
      fs.existsSync.withArgs('sites/foo').returns(true);
      path.resolve.withArgs(process.cwd(), 'sites', 'foo').returns('sites/foo');
    });

    it('returns an internal path of the site', function () {
      const expected = 'sites/foo';

      expect(fn('foo')).to.equal(expected);
    });
  });
});
