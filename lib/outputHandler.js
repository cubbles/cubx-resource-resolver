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

        await this._writeOutputFile(conf.htmlImport, packet.htmlImport);

        dir = path.dirname(conf.javascript);
        await ensureDir(dir);
        await this._writeOutputFile(conf.javascript, packet.javascript);

        dir = path.dirname(conf.stylesheet);
        await ensureDir(dir);
        await this._writeOutputFile(conf.stylesheet, packet.stylesheet);

        dir = path.dirname(conf.htmlImportJavascript);
        await ensureDir(dir);

        await this._writeOutputFile(conf.htmlImportJavascript, packet.htmlImportJavascript);

        await this._writeResources(packet.resources, outputDir);
      } catch (e) {
        console.error(e.message);
      }
    }

    async _writeOutputFile (outputPath, data) {
      await writeFile(outputPath, data, 'UTF-8');
    }

    async _writeResources (resources, outputDir) {
      if (!resources) {
        return;
      }

      for (let i = 0; i < resources.length; i++) {
        let resource = resources[i];
        await this._writeResource(resource, outputDir);
      }
    }

    async _writeResource (resource, outputDir) {
      let dirPath = path.dirname(resource.path);
      let fileName = path.basename(resource.path);
      dirPath = path.resolve(outputDir, dirPath);
      if (this.mode === 'dev') {
        console.log(`create or use ${dirPath} directory`);
      }
      try {
        await ensureDir(dirPath);
      } catch (err) {
        console.log(err);
      }
      let filePath = path.join(dirPath, fileName);
      if (await fs.pathExists(filePath)) {
        console.warn(`The resource ${filePath} will be override, because it is already downloaded!`);
      }
      return this._writeOutputFile(filePath, resource.resource);
    }
  }

  module.exports = OutputHandler;
}());
