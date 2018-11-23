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
      let packet = {};
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
            this._handleJavascript(resource, packet);
            break;
          case 'stylesheet':
            this._handleStylesheet(resource, packet);
            break;
          default:
            console.warn('The resource type "' + resourceDef.type + '" is not allowed and will be ignored.');
        }
      }
      return packet;
    }

    async _handleHtmlImport (resource, originUrl, packet) {
      let baseUrl = originUrl.substring(0, originUrl.lastIndexOf('/'));
      // find <script src=""> Tags
      let re = /<script.+src="?([^"]+)"?>\s*<\/script>/g;
      let myArray;
      while ((myArray = re.exec(resource)) !== null) {
        // getArtifactArray and add the scripts to packet.htmlImportJavascript
        if (this.mode === 'dev') {
          console.log('sub resource from ', originUrl, 'fetch resource:', myArray[ 1 ]);
        }
        let res = await this._fetchResource(myArray[ 1 ], baseUrl);
        if (packet.htmlImportJavascript) {
          packet.htmlImportJavascript += res;
        } else {
          packet.htmlImportJavascript = res;
        }
      }
      // delete <script src=""> tags
      resource = resource.replace(re, '');

      // find <link rel="stylesheet"> Tags
      re = /<link\s+(href="?([^"\s]+)"?.*|.*href="?([^"\s]+)"?.*)>/g;
      while ((myArray = re.exec(resource)) !== null) {
        // getArtifactArray and add the css to packet.css
        let res = await this._fetchResource(myArray[ 2 ] || myArray[ 3 ], baseUrl);
        if (packet.css) {
          packet.stylesheet += res;
        } else {
          packet.stylesheet = res;
        }
      }
      // delete link tags and ad to packet
      if (packet.htmlImport) {
        packet.htmlImport += resource.replace(re, '').trim();
      } else {
        packet.htmlImport = resource.replace(re, '').trim();
      }
    }

    _handleJavascript (resource, packet) {
      if (packet.script) {
        packet.javascript += resource;
      } else {
        packet.javascript = resource;
      }
    }

    _handleStylesheet (resource, packet) {
      if (packet.stylesheet) {
        packet.stylesheet += resource;
      } else {
        packet.stylesheet = resource;
      }
    };

    async _fetchResource (file, baseUrl) {
      let url;
      if (!baseUrl || file.startsWith('http')){
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
