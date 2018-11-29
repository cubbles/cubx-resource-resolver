const ArtifactsDepsResolver = require('cubx-dependency-resolver');
const ResourcePacker = require('./resourcePacker');
const InputHandler = require('./inputHandler');
const OutputHandler = require('./outputHandler');
class ResourceResolver {
  constructor (mode) {
    this.mode = mode || 'prod';
  }
  async resolve (input, outputDir, baseUrl, excludes) {
    this._checkParameter(input, baseUrl);
    let inputHandler = new InputHandler(this.mode);
    let inputArray = await inputHandler.getArtifactArray(input);
    console.log('Please wait for calculating resource list...');
    if (!baseUrl.endsWith('/')) {
      baseUrl = baseUrl + '/';
    }
    let artifactsDepsResolver = new ArtifactsDepsResolver();
    artifactsDepsResolver.enableACR();
    let resourceList = await artifactsDepsResolver.resolveResourcesList(inputArray, baseUrl, this.mode, excludes);
    if (this.mode === 'dev') {
      console.log('resourceList', JSON.stringify(resourceList, null,2));
    }
    console.log('calculating resource list is ready');

    let resourcePacker = new ResourcePacker(baseUrl, this.mode);
    let resourcePacket = await resourcePacker.createResourcePacket(resourceList);

    let outputHandler = new OutputHandler(this.mode);
    await outputHandler.writeOutputFiles(resourcePacket, outputDir);
  }

  _checkParameter (input, baseUrl) {
    if (!input) {
      throw Error('The input parameter is required');
    }
    if (!baseUrl) {
      throw Error('The baseUrl parameter is required');
    }
  }
}

module.exports = ResourceResolver;
