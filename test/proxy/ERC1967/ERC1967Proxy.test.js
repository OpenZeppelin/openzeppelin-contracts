const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');

describe.only('ERC1967Proxy', function () {
  // `undefined`, `null` and other false-ish opts will not be forwarded.
  const createProxy = async function (implementation, initData, opts) {
    return ethers.deployContract('ERC1967Proxy', [implementation, initData], opts);
  };

  shouldBehaveLikeProxy(createProxy);
});
