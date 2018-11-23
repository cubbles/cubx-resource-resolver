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
        htmlImport: 'html-import.html',
        javascript: 'scripts.js',
        stylesheet: 'styles.css',
        htmlImportJavascript: 'html-import-scripts.js'
      };
    }

    async writeOutputFiles (packet, outputConf) {
      let conf = {};
      if (outputConf && typeof outputConf === 'object') {
        Object.assign(conf, this.defaultConfig, outputConf);
      } else {
        conf = this.defaultConfig;
      }
      try {
        let dir = path.dirname(conf.htmlImport);
        if (dir !== '.') {
          await ensureDir(dir);
        }
        await this.writeOutputFile(conf.htmlImport, packet.htmlImport);

        dir = path.dirname(conf.javascript);
        if (dir !== '.') {
          await ensureDir(dir);
        }
        await this.writeOutputFile(conf.javascript, packet.javascript);

        dir = path.dirname(conf.stylesheet);
        if (dir !== '.') {
          await ensureDir(dir);
        }
        await this.writeOutputFile(conf.stylesheet, packet.stylesheet);

        dir = path.dirname(conf.htmlImportJavascript);
        if (dir !== '.') {
          await ensureDir(dir);
        }
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
