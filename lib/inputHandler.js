(function () {
  const Ajv = require('ajv');
  const fs = require('fs-extra');
  const path = require('path');

  class InputHandler {
    constructor (mode) {
      this.mode = mode || 'prod';
    }
    async getArtifactArray (data) {
      if (!data) {
        throw new Error('No input parameter.');
      }
      if (typeof data === 'string') {
        if (data.startsWith('[')) {
          data = JSON.parse(data);
        } else {
          data = await this._readFile(data);
        }
      }
      if (typeof data === 'object') {
        return this._checkInputArray(data);
      } else {
        throw new SyntaxError('The input correspond not to an artifact array. Please define an object like this: [{"artifactId": "my-artifact", "webpacakgeId": "my-webpackage@1.0"}]');
      }
    }

    async _readFile (path) {
      try {
        return fs.readJson(path);
      } catch (error) {
        throw new Error('Can not read the file ' + path + '.');
      }
    };

    async _checkInputArray (input) {
      let schemaPath = path.join(__dirname, 'schema', 'artifactArray.schema.json');
      let schema = await fs.readJson(schemaPath);
      let ajv = new Ajv();
      let valid = ajv.validate(schema, input);
      if (!valid) {
        throw new SyntaxError('Not schema conform data: ' + ajv.errorsText());
      }
      return input;
    };

    async _checkOutputConf (data) {
      let schemaPath = path.join(__dirname, 'schema', 'outputConf.schema.json');
      let schema = await fs.readJson(schemaPath);
      let ajv = new Ajv();
      let valid = ajv.validate(schema, data);
      if (!valid) {
        throw new SyntaxError('Not schema conform data: ' + ajv.errorsText());
      }
      return data;
    };
  }

  module.exports = InputHandler;
}());
