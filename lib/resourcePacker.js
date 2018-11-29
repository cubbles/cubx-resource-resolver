(function () {
  'use strict';
  const axios = require('axios');

  // const Promise = require('promise');
  class ResourcePacker {
    constructor (baseUrl, mode) {
      this.mode = mode || 'prod';
      this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }

    async createResourcePacket (resourceList) {
      let packet = {
        htmlImport: '',
        javascript: '',
        stylesheet: '',
        htmlImportJavascript: ''
      };
      let promises = resourceList.map(async (resource) => {
        if (this.mode === 'dev') {
          console.log('fetch resource:' + resource.path);
        }
        let response = await axios.get(resource.path);
        return response.data;
      });
      let resultList = await Promise.all(promises);
      for (let index = 0; index < resourceList.length; index++) {
        let resourceDef = resourceList[ index ];
        var resource = resultList[ index ];
        switch (resourceDef.type) {
          case 'htmlImport':
            await this._handleHtmlImport(resource, resourceDef.path, packet);
            break;
          case 'javascript':
            this._handleJavascript(resource, resourceDef.path, packet);
            break;
          case 'stylesheet':
            this._handleStylesheet(resource, resourceDef.path, packet);
            break;
          default:
            console.warn('The resource type "' + resourceDef.type + '" is not allowed and will be ignored.');
        }
      }

      return packet;
    }

    async _handleHtmlImport (resource, originUrl, packet) {
      let result = await this._resolveHtmlImportDependencies(resource, originUrl);
      // delete link tags and ad to packet

      packet.htmlImport += result.htmlImport;
      packet.stylesheet += result.stylesheet;
      packet.htmlImportJavascript += result.htmlImportJavascript;
    }

    async _resolveHtmlImportDependencies (resource, originUrl) {
      let baseUrl = originUrl.substring(0, originUrl.lastIndexOf('/')+1);
      let result = {
        stylesheet: '',
        htmlImport: '',
        htmlImportJavascript: ''
        // htmlImportJavascript: {}
      };
      // find <script src=""> Tags
      let re = /<script.+src="?([^"]+)"?>\s*<\/script>/g;
      let myArray;

      while ((myArray = re.exec(resource)) !== null) {
        // getArtifactArray and add the scripts to packet.htmlImportJavascript
        if (this.mode === 'dev') {
          console.log('sub resource from ', originUrl, 'fetch resource:', myArray[ 1 ]);
        }
        let res = await this._fetchResource(myArray[ 1 ], baseUrl);
        if (this.mode === 'dev') {
          result.htmlImportJavascript += '/* referer: ' + originUrl + ' */\n';
        }
        result.htmlImportJavascript += res;
        if (!result.htmlImportJavascript.endsWith(';')) {
          result.htmlImportJavascript += ';';
        }
      }
      // delete <script src=""> tags
      resource = resource.replace(re, '');

      // find <link rel="stylesheet"> Tags
      re = /<link\s+[^>]*href="?([^"\s]+\.css)"?[^>]*[^>]*[^-]?>/g;
      while ((myArray = re.exec(resource)) !== null) {
        // getArtifactArray and add the css to packet.css
        let res = await this._fetchResource(myArray[ 1 ], baseUrl);
        if (this.mode === 'dev') {
          result.stylesheet += '/* referer: ' + originUrl + ' */\n';
        }
        result.stylesheet += res;
      }
      resource = resource.replace(re, '');
      // find <link rel="stylesheet"> Tags
      re = /<link\s+[^>]*href="?([^"\s]+\.html)"?[^>]*[^->]?>/g;
      while ((myArray = re.exec(resource)) !== null) {
        // getArtifactArray and add the css to packet.css
        let res = await this._fetchResource(myArray[ 1 ], baseUrl);
        let subres = await this._resolveHtmlImportDependencies(res, baseUrl + (myArray[ 2 ] || myArray[ 3 ]));

        result.stylesheet += subres.stylesheet;
        result.htmlImport += subres.htmlImport;
        result.htmlImportJavascript += subres.htmlImportJavascript;
      }
      resource = resource.replace(re, '');
      if (this.mode === 'dev') {
        result.htmlImport += '<!-- referer: ' + originUrl + ' -->\n';
      }
      result.htmlImport += resource;
      return result;
    }

    _handleJavascript (resource, url, packet) {
      if (this.mode === 'dev') {
        if (packet.javascript) {
          packet.javascript += '/* referer: ' + url + ' */\n';
        } else {
          packet.javascript = '/* referer: ' + url + ' */\n';
        }
      }
      if (packet.javascript) {
        packet.javascript += resource;
      } else {
        packet.javascript = resource;
      }

      if (!packet.javascript.endsWith(';')) {
        packet.javascript += ';';
      }
    }

    _handleStylesheet (resource, url, packet) {
      if (this.mode === 'dev') {
        if (packet.stylesheet) {
          packet.stylesheet += '/* referer: ' + url + ' */\n';
        } else {
          packet.stylesheet = '/* referer: ' + url + ' */\n';
        }
      }
      if (packet.stylesheet) {
        packet.stylesheet += resource;
      } else {
        packet.stylesheet = resource;
      }
    };

    async _fetchResource (file, baseUrl) {
      let url;
      if (!baseUrl || file.startsWith('http')) {
        url = file;
      } else {
        url = baseUrl + '/' + file;
      }
      let result;
      try {
        result = (await axios.get(url)).data;
      } catch (e) {
        console.error('Fetching the resource "' + file + '" get the following error:', e.message);
        result = '';
      }
      return result;
    }
  }

  module.exports = ResourcePacker;
}());
