/* globals describe, beforeEach, afterEach, it, expect */
(function () {
  'use strict';
  const ResourceResolver = require('../../lib/cubxResourceResolver');
  const ResourcePacker = require('../../lib/resourcePacker');
  const sinon = require('sinon');
  const axios = require('axios');
  const path = require('path');
  const ArtifactsDepsResolver = require('cubx-dependency-resolver');
  const fs = require('fs');
  const util = require('util');
  const readFile = util.promisify(fs.readFile);
  const OutputHandler = require('../../lib/outputHandler');
  describe('cubxResourcenResolver', () => {
    let resourceResolver;
    let testPath;
    beforeEach(() => {
      resourceResolver = new ResourceResolver();
      testPath = path.resolve('test', 'fixtures');
    });
    afterEach(() => {
      resourceResolver = null;
    });

    describe('#_checkParameter', () => {
      it('should throw an Error if at least one of the parameter missed or null', () => {
        expect(() => {
          resourceResolver._checkParameter();
        }).throw(Error);
        expect(() => {
          resourceResolver._checkParameter('input');
        }).throw(Error);
        expect(() => {
          resourceResolver._checkParameter(null, 'test.js', 'http://example');
        }).throw(Error);
        expect(() => {
          resourceResolver._checkParameter('xxx', null, 'http://example');
        }).throw(Error);
        expect(() => {
          resourceResolver._checkParameter('xxx', 'zzz');
        }).throw(Error);
        expect(() => {
          resourceResolver._checkParameter('xxx', 'zzz', null);
        }).throw(Error);
        expect(() => {
        });
      });
    });
    describe('#resolve', () => {
      let axiosStub; // eslint-disable-line no-unused-vars
      let baseUrl;
      let resolveResourcesListStub;
      let createResourcePacketSpy;
      let writeOutputFilesStub;
      beforeEach(() => {
        baseUrl = 'http://example.com';
        axiosStub = sinon.stub(axios, 'get').callsFake(async (url) => {
          return {
            data: await readFile(path.resolve(testPath, url.substr(baseUrl.length)), 'utf8')
          };
        });
        resolveResourcesListStub = sinon.stub(ArtifactsDepsResolver.prototype, 'resolveResourcesList').callsFake((artifactList) => {
          let resourceList = [
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
          return resourceList;
        });

        createResourcePacketSpy = sinon.spy(ResourcePacker.prototype, 'createResourcePacket');
        writeOutputFilesStub = sinon.stub(OutputHandler.prototype, 'writeOutputFiles');
      });
      afterEach(() => {
        axios.get.restore();
        ArtifactsDepsResolver.prototype.resolveResourcesList.restore();
        ResourcePacker.prototype.createResourcePacket.restore();
        OutputHandler.prototype.writeOutputFiles.restore();
      });
      it('should resolve a resource files sucessfully', async () => {
        await resourceResolver.resolve([
          {
            artifactId: 'example-artifact-1',
            webpackageId: 'example@1.0.0'
          }, {
            artifactId: 'example-artifact-2',
            webpackageId: 'example@1.0.0'
          },
          {
            artifactId: 'util1',
            webpackageId: 'example@1.0.0'
          }
        ],
        {
          htmlImport: 'output/html-import',
          javascript: 'output/script',
          stylesheet: 'styles.css',
          htmlImportJavascript: 'htmlImportScript.js'
        }, baseUrl);
        resolveResourcesListStub.should.calledOnce;
        createResourcePacketSpy.should.calledOnce;
        writeOutputFilesStub.should.calledOnce;
      });
    });
  });
}());
