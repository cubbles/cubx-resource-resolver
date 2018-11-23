/* globals before */
'use strict';

before(function (done) {
  let chai = require('chai');
  let chaiAsPromised = require('chai-as-promised');
  chai.use(chaiAsPromised);
  chai.should();
  global.assert = require('assert');
  global.expect = require('chai').expect;
  global.sinon = require('sinon');
  let sinonChai = require('sinon-chai');
  chai.use(sinonChai);
  done();
});
