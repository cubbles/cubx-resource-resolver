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
  const path = require('path');

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
      describe('outputDir exists', () => {
        it(`should write all files to configured paths`, async () => {
          await outputHandler.writeOutputFiles(packet, 'test/output');
          let outputDir = path.resolve('test', 'output');
          let htmlImportFile = path.resolve(outputDir, 'html-imports.html');
          let javascriptFile = path.resolve(outputDir, 'scripts.js');
          let stylesheetFile = path.resolve(outputDir, 'styles.css');
          let htmlInportScriptFile = path.resolve(outputDir, 'html-import-scripts.js');
          expect(await pathExists(htmlImportFile)).to.be.true;
          expect(await pathExists(javascriptFile)).to.be.true;
          expect(await pathExists(stylesheetFile)).to.be.true;
          expect(await pathExists(htmlInportScriptFile)).to.be.true;

          expect(await readFile(htmlImportFile)).to.match(/dom-module/);
          expect(await readFile(htmlImportFile)).to.match(/example-artifact-1/);

          expect(await readFile(javascriptFile)).to.match(/console.log\('example'\);/);

          expect(await readFile(stylesheetFile)).to.match(/example-artifact-1 div/);

          expect(await readFile(htmlInportScriptFile)).to.match(/console.log\('example-artifact-1'\);/);
        });
      });
      describe('outputDir not exists', () => {
        after(async () => {
          await Promise.all(Object.values(outputHandler.defaultConfig).map(async (value) => {
            await remove(value);
          }));
        });

        it(`should write files to current`, async () => {
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

    });
  });
}());
