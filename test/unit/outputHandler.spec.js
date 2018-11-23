/* globals describe, before, after, it, expect */
(function () {
  'use strict';
  const OutputHandler = require('../../lib/outputHandler');
  const fs = require('fs-extra');
  const util = require('util');
  const emptyDir = util.promisify(fs.emptyDir);
  const readFile = util.promisify(fs.readFile);
  const pathExists = util.promisify(fs.pathExists);
  const remove = util.promisify(fs.remove);

  describe('Outputhandler', () => {
    let outputHandler;
    let packet;
    before(() => {
      outputHandler = new OutputHandler();
      packet = {
        htmlImport: `<dom-module id="example-artifact-1"> 
            <template>
                <div class="content"></div>
            </template>
        </dom-module>`,
        javascript: `console.log('example');`,
        stylesheet: 'example-artifact-1 div',
        htmlImportJavascript: `console.log('example-artifact-1');`
      };
    });
    after(async () => {
      outputHandler = null;
      await emptyDir('test/output');
    });
    describe('#writeOutputFiles', () => {
      describe('exists outputConf', () => {
        it(`should write all files to configured paths`, async () => {
          let outputConfig = {
            'htmlImport': 'test/output/html-imports.html',
            'javascript': 'test/output/scripts.js',
            'stylesheet': 'test/output/styles.css',
            'htmlImportJavascript': 'test/output/htmlImportScripts.js'
          };
          await outputHandler.writeOutputFiles(packet, outputConfig);
          expect(await pathExists(outputConfig.htmlImport)).to.be.true;
          expect(await pathExists(outputConfig.javascript)).to.be.true;
          expect(await pathExists(outputConfig.stylesheet)).to.be.true;
          expect(await pathExists(outputConfig.htmlImportJavascript)).to.be.true;

          expect(await readFile(outputConfig.htmlImport)).to.match(/dom-module/);
          expect(await readFile(outputConfig.htmlImport)).to.match(/example-artifact-1/);

          expect(await readFile(outputConfig.javascript)).to.match(/console.log\('example'\);/);

          expect(await readFile(outputConfig.stylesheet)).to.match(/example-artifact-1 div/);

          expect(await readFile(outputConfig.htmlImportJavascript)).to.match(/console.log\('example-artifact-1'\);/);
        });
      });
      describe('outputConf not exists', () => {
        after(async () => {
          await Promise.all(Object.values(outputHandler.defaultConfig).map(async (value) => {
            await remove(value);
          }));
        });

        it(`should write files to default paths`, async () => {
          await outputHandler.writeOutputFiles(packet);
          expect(await pathExists(outputHandler.defaultConfig.htmlImport)).to.be.true;
          expect(await pathExists(outputHandler.defaultConfig.javascript)).to.be.true;
          expect(await pathExists(outputHandler.defaultConfig.stylesheet)).to.be.true;
          expect(await pathExists(outputHandler.defaultConfig.htmlImportJavascript)).to.be.true;

          expect(await readFile(outputHandler.defaultConfig.htmlImport)).to.match(/dom-module/);
          expect(await readFile(outputHandler.defaultConfig.htmlImport)).to.match(/example-artifact-1/);

          expect(await readFile(outputHandler.defaultConfig.javascript)).to.match(/console.log\('example'\);/);

          expect(await readFile(outputHandler.defaultConfig.stylesheet)).to.match(/example-artifact-1 div/);

          expect(await readFile(outputHandler.defaultConfig.htmlImportJavascript)).to.match(/console.log\('example-artifact-1'\);/);
        });
      });

      describe('outputConf not full distincts', () => {
        after(async () => {
          await remove(outputHandler.defaultConfig.javascript);
        });

        it(`should write files to default paths`, async () => {
          let outputConfig = {
            'htmlImport': 'test/output/html-imports.html',
            'stylesheet': 'test/output/styles.css',
            'htmlImportJavascript': 'test/output/htmlImportScripts.js'
          };
          await outputHandler.writeOutputFiles(packet, outputConfig);
          expect(await pathExists(outputConfig.htmlImport)).to.be.true;
          expect(await pathExists(outputConfig.stylesheet)).to.be.true;
          expect(await pathExists(outputConfig.htmlImportJavascript)).to.be.true;
          expect(await pathExists(outputHandler.defaultConfig.javascript)).to.be.true;

          expect(await readFile(outputConfig.htmlImport)).to.match(/dom-module/);
          expect(await readFile(outputConfig.htmlImport)).to.match(/example-artifact-1/);

          expect(await readFile(outputConfig.stylesheet)).to.match(/example-artifact-1 div/);

          expect(await readFile(outputConfig.htmlImportJavascript)).to.match(/console.log\('example-artifact-1'\);/);

          expect(await readFile(outputHandler.defaultConfig.javascript)).to.match(/console.log\('example'\);/);
        });
      });
    });
  });
}());
