const ArtifactsDepsResolver = require('cubx-dependency-resolver');
const ResourcePacker = require('./resourcePacker');
const InputHandler = require('./inputHandler');
const OutputHandler = require('./outputHandler');
class ResourceResolver {
  constructor (mode) {
    this.mode = mode || 'prod';
  }
  async resolve (input, outputConf, baseUrl) {
    this._checkParameter(input, outputConf, baseUrl);
    let inputHandler = new InputHandler(this.mode);
    let inputArray = await inputHandler.getArtifactArray(input);

    console.log('Please wait for calculating resource list...');
    if (!baseUrl.endsWith('/')) {
      baseUrl = baseUrl + '/';
    }
    let artifactsDepsResolver = new ArtifactsDepsResolver();
    let resourceList = await artifactsDepsResolver.resolveResourcesList(inputArray, baseUrl, this.mode);
    console.log('calculating resource list is ready');

    let resourcePacker = new ResourcePacker(baseUrl, this.mode);
    let resourcePacket = await resourcePacker.createResourcePacket(resourceList);

    let outputHandler = new OutputHandler(this.mode);
    await outputHandler.writeOutputFiles(resourcePacket, await inputHandler.getOutputConf(outputConf));
  }

  _checkParameter (input, outputConf, baseUrl) {
    if (!input) {
      throw Error('The input parameter is required');
    }
    if (!outputConf) {
      throw Error('The output configuration parameter is required');
    }
    if (!baseUrl) {
      throw Error('The baseUrl parameter is required');
    }
  }
}

module.exports = ResourceResolver;
