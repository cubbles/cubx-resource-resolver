#! /usr/bin/env node

const cliArgs = require('command-line-args');
const cliUsage = require('command-line-usage');
const CubxResourceResolver = require('../lib/cubxResourceResolver');

const args = [
  {
    name: 'input',
    type: String,
    alias: 'i',
    description: 'Path to input file or json array of artifacts objects. Requiered'
  },
  {
    name: 'outputConf',
    type: String,
    alias: 'o',
    description: 'Output config. This should be json object or a path to a json file. The required config is something like this: {"htmlImport": "output/html-imports.html","javascript": "./output/scripts.js","stylesheet": "./output/styles.css", "htmlImportJavascript": "./output/htmlImportScripts.js"}'
  },
  {
    name: 'base-url',
    type: String,
    alias: 'b',
    defaultValue: 'https://cubbles.world/sandbox',
    description: 'The base url for resolve dependencies of artifacts.'
  },
  {
    name: 'mode',
    type: String,
    alias: 'm',
    defaultValue: 'prod',
    description: 'The base url for resolve dependencies of artifacts.'
  },
  {
    name: 'help',
    type: Boolean,
    alias: 'h',
    description: 'Display this usage guide.'
  }
];

const options = cliArgs(args, { camelCase: true });

const usageStrings = [
  {
    header: '<cubx-cache-config-generator> CLI',
    content: 'Download and merge the resources to each a single resourcefile. The input is a list of root dependencies. \\[ \\{"artifactId": "my-artifact", "webpackageId": "my-webpackage@1.0.0"\\} \\]'
  },
  {
    header: 'Options',
    optionList: args
  }
];

if (options.help) {
  let usage = cliUsage(usageStrings);
  console.log(usage);
}

let outputConf = options.outputConf;

let input = options.input;
let baseUrl = options.baseUrl;
let message;

if (!input) {
  message = 'The option --input is required.';
}
if (!baseUrl) {
  if (message && message.length > 0) {
    message = message + '; ';
  }
  message = message + 'The option --base-url is required.';
}
if (!input || !baseUrl) {
  let extendUsageStrings = [
    {
      header: 'Error: not enough parameter',
      content: message
    }
  ];
  extendUsageStrings = extendUsageStrings.concat(usageStrings);
  const extendedUsage = cliUsage(extendUsageStrings);
  console.log(extendedUsage);
  process.exit(1);
} else {
  const generator = new CubxResourceResolver(options.mode);
  generator.resolve(input, outputConf, baseUrl).then(() => {
    process.exit();
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
