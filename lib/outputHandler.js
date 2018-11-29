(function () {
  const fs = require('fs-extra');
  const util = require('util');
  const path = require('path');
  const writeFile = util.promisify(fs.writeFile);
  const ensureDir = util.promisify(fs.ensureDir);

  class OutputHandler {
    constructor (mode) {
      this.mode = mode || 'prod';
      this.defaultConfig = {
        htmlImport: 'html-imports.html',
        javascript: 'scripts.js',
        stylesheet: 'styles.css',
        htmlImportJavascript: 'html-import-scripts.js'
      };
    }

    async writeOutputFiles (packet, outputDir) {
      if (!outputDir) {
        outputDir = '.';
      }
      let conf = {};
      conf.htmlImport = path.resolve(outputDir, this.defaultConfig.htmlImport);
      conf.javascript = path.resolve(outputDir, this.defaultConfig.javascript);
      conf.stylesheet = path.resolve(outputDir, this.defaultConfig.stylesheet);
      conf.htmlImportJavascript = path.resolve(outputDir, this.defaultConfig.htmlImportJavascript);

      packet.htmlImport += '\n<script src="' + this.defaultConfig.htmlImportJavascript + '"></script>';
      try {
        let dir = path.dirname(conf.htmlImport);
        await ensureDir(dir);

        await this.writeOutputFile(conf.htmlImport, packet.htmlImport);

        dir = path.dirname(conf.javascript);
        await ensureDir(dir);
        await this.writeOutputFile(conf.javascript, packet.javascript);

        dir = path.dirname(conf.stylesheet);
        await ensureDir(dir);
        await this.writeOutputFile(conf.stylesheet, packet.stylesheet);

        dir = path.dirname(conf.htmlImportJavascript);
        await ensureDir(dir);

        await this.writeOutputFile(conf.htmlImportJavascript, packet.htmlImportJavascript);
      } catch (e) {
        console.error(e.message);
      }
    }

    async writeOutputFile (outputPath, data) {
      await writeFile(outputPath, data, 'UTF-8');
    }
  }

  module.exports = OutputHandler;
}());
