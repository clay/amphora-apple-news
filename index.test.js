const _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  expect = require('chai').expect,
  sinon = require('sinon'),
  path = require('path'),
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

  function mockContent() {
    return [
      {
        '_ref': 'some/component/uri1',
        role: 'title',
        text: 'This is a Story'
      },
      {
        '_ref': 'some/component/uri3',
        multi: true,
        components: [
          {
            role: 'photo',
            URL: 'zoe.com/coolpic.jpg'
          },
          {
            role: 'caption',
            text: 'Photo: zoe\'s photo studio'
          }
        ]
      }
    ];
  }

  describe('getSiteConfig', function () {
    const data = { site: { dir: FAKE_SITE_DIR } },
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

    it('includes a component if it does not have the "role" property but does have the "multi" property', function () {
      const data = { site, '_data': { content: mockContent() } };

      expect(fn(data).output.components[1].role).to.equal('photo');
      expect(fn(data).output.components[2].role).to.equal('caption');
    });

    it('does not include components without a "role" or "multi" property', function () {
      const data = { site, '_data': { content: [ { '_ref': 'some/uri' } ] } };

      expect(fn(data).output.components).to.be.empty;
    });

    it('removes the "_ref" property from all included ANF components', function () {
      const data = { site, '_data': { content: mockContent() } },
        output = fn(data).output;

      expect(_.filter(output.components, (cmpt) => !!cmpt._ref)).to.be.empty;
    });

    it('sets the output type to "json"', function () {
      const data = { site, '_data': { content: mockContent() } };

      expect(fn(data).type).to.equal('json');
    });
  });
});
