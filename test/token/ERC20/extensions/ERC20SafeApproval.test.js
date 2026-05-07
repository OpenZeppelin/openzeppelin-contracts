const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const time = require('../../../helpers/time');

const cap = 500n;

async function fixture() {
  const [holder, spender, other] = await ethers.getSigners();
  const token = await ethers.deployContract('ERC20SafeApprovalMock', ['My Token', 'MTKN', cap]);
  await token.mint(holder, 1000n);
  return { holder, spender, other, token };
}

describe('ERC20SafeApproval', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

});
