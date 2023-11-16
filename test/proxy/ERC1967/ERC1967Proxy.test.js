const { ethers } = require('hardhat');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');

describe.only('ERC1967Proxy', function () {
  // `undefined`, `null` and other false-ish opts will not be forwarded.
  before(function () {
    this.createProxy = function (implementation, initData, opts) {
      return ethers.deployContract('ERC1967Proxy', [implementation, initData], opts);
    };
  })

  shouldBehaveLikeProxy();
});
