/* globals describe, before, after, beforeEach, afterEach, it, sinon, expect */
(function () {
  'use strict';
  const ResourcePacker = require('../../lib/resourcePacker');
  const fs = require('fs');
  const axios = require('axios');
  const path = require('path');
  const util = require('util');
  const readFile = util.promisify(fs.readFile);

  describe('resourcePacker', () => {
    let baseUrl;
    let resourcePacker;
    let testPath;
    before(() => {
      baseUrl = 'http://example.com';
      resourcePacker = new ResourcePacker(baseUrl);
      testPath = path.resolve('test', 'fixtures');
    });
    after(() => {
      baseUrl = null;
      resourcePacker = null;
    });
    describe('#createResourcePacket', () => {
      let resourceList;
      let handleHtmlImportSpy;
      let handleJavascriptSpy;
      let handleStylesheetSpy;
      let axiosStub; // eslint-disable-line no-unused-vars
      before(function () {
        resourceList = [
          {
            path: baseUrl + 'example@1.0.0/example-artifact-1/example-artifact-1.html',
            type: 'htmlImport'
          },
          {
            path: baseUrl + 'example@1.0.0/example-artifact-1/styles/example.css',
            type: 'stylesheet'
          },
          {
            path: baseUrl + 'example@1.0.0/example-artifact-2/example-artifact-2.html',
            type: 'htmlImport'
          },
          {
            path: baseUrl + 'example@1.0.0/util1/js/util.js',
            type: 'javascript'
          }
        ];
      });
      beforeEach(() => {
        axiosStub = sinon.stub(axios, 'get').callsFake(async (url) => {
          return {
            data: await readFile(path.resolve(testPath, url.substr(baseUrl.length)), 'utf8')
          };
        });
        handleHtmlImportSpy = sinon.spy(resourcePacker, '_handleHtmlImport');
        handleJavascriptSpy = sinon.spy(resourcePacker, '_handleJavascript');
        handleStylesheetSpy = sinon.spy(resourcePacker, '_handleStylesheet');
      });
      afterEach(() => {
        resourcePacker._handleHtmlImport.restore();
        resourcePacker._handleJavascript.restore();
        resourcePacker._handleStylesheet.restore();
        axios.get.restore();
      });
      it('should create resourcePacket', async () => {
        let packet = await resourcePacker.createResourcePacket(resourceList);
        handleHtmlImportSpy.should.calledTwice;
        handleJavascriptSpy.should.calledOnce;
        handleStylesheetSpy.should.calledOnce;
        packet.htmlImport.should.be.match(/id="example-artifact-1"/);
        packet.htmlImport.should.be.match(/id="example-artifact-2"/);
        packet.htmlImport.should.be.match(/<h1>subresource<\/h1>/);
        packet.htmlImport.should.be.match(/<h1>otherSubresource<\/h1>/);
        packet.stylesheet.should.be.match(/example-artifact-1/);
        packet.stylesheet.should.be.match(/example-css/);
        packet.javascript.should.be.match(/console.log\('util1'\)/);
        packet.htmlImportJavascript.should.be.match(/console.log\('example-artifact-1'\)/);
        packet.htmlImportJavascript.should.be.match(/console.log\('example-artifact-2'\)/);
        packet.htmlImportJavascript.should.be.match(/console.log\('otherScript'\)/);
        packet.htmlImportJavascript.should.be.match(/console.log\('example-artifact-2-other'\)/);
      });
    });
    describe('#_handleHtmlImport', function () {
      let axiosStub; // eslint-disable-line no-unused-vars
      let packet;
      let resource;
      let resourcePath;
      let fetchResourceSpy;
      beforeEach(async () => {
        axiosStub = sinon.stub(axios, 'get').callsFake(async (url) => {
          return {
            data: await readFile(testPath + path.normalize(url.substr(baseUrl.length)), 'utf8')
          };
        });
        packet = {};

        let filePath = path.resolve('test', 'fixtures', 'example@1.0.0', 'example-artifact-1', 'example-artifact-1.html');
        resource = await readFile(filePath, 'utf8');
        fetchResourceSpy = sinon.spy(resourcePacker, '_fetchResource');
      });
      afterEach(() => {
        axios.get.restore();
        resourcePacker._fetchResource.restore();
      });
      it('should fill child resources to packet', async () => {
        resourcePath = baseUrl + '/example@1.0.0/example-artifact-1/example-artifact-1.html';
        await resourcePacker._handleHtmlImport(resource, resourcePath, packet);
        fetchResourceSpy.should.have.property('callCount', 5);
        expect(packet.htmlImport).to.be.exist;
        expect(packet.htmlImportJavascript).to.be.exist;
        expect(packet.stylesheet).to.be.exist;
        packet.htmlImport.should.be.match(/id="example-artifact-1"/);
        packet.htmlImport.should.be.match(/<h1>subresource<\/h1>/);
        packet.htmlImport.should.be.match(/<h1>otherSubresource<\/h1>/);
        packet.htmlImportJavascript.should.be.match(/console.log\('example-artifact-1'\);/);
        packet.htmlImportJavascript.should.be.match(/console.log\('otherScript'\);/);
        packet.stylesheet.should.be.match(/example-artifact-1/);
      });
      it('should delete child resources from original', async () => {
        resourcePath = baseUrl + '/example@1.0.0/example-artifact-1/example-artifact-1.html';
        await resourcePacker._handleHtmlImport(resource, resourcePath, packet);
        expect(packet.htmlImport).to.be.exist;
        packet.htmlImport.should.be.not.match(/script/);
        packet.htmlImport.should.be.not.match(/link/);
      });
    });
    describe('#_handleScript', () => {
      let packet;
      let resource;
      let url;
      beforeEach(async () => {
        packet = {};
        let filePath = path.resolve('test', 'fixtures', 'example@1.0.0', 'util1', 'js', 'util.js');
        resource = await readFile(filePath, 'utf8');
        url = filePath;
      });
      afterEach(() => {
        packet = null;
      });
      it('should add resource to packet.javascript', async () => {
        await resourcePacker._handleJavascript(resource, url, packet);
        expect(packet.javascript).to.be.exist;
        packet.javascript.should.match(/console.log\('util1'\);/);
      });
    });

    describe('#_handleStyleSheet', () => {
      let packet;
      let resource;
      let url;
      beforeEach(async () => {
        packet = {};
        let filePath = path.resolve('test', 'fixtures', 'example@1.0.0', 'example-artifact-1', 'styles', 'example.css');
        resource = await readFile(filePath, 'utf8');
        url = filePath;
      });
      afterEach(() => {
        packet = null;
      });
      it('should add resource to packet.stylesheet', async () => {
        await resourcePacker._handleStylesheet(resource, url, packet);
        expect(packet.stylesheet).to.be.exist;
        packet.stylesheet.should.match(/example-css/);
      });
    });
  });
}());
