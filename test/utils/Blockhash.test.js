const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mineUpTo, setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../helpers/account');

const SYSTEM_ADDRESS = '0xfffffffffffffffffffffffffffffffffffffffe';
const HISTORY_SERVE_WINDOW = 8191;
const BLOCKHASH_SERVE_WINDOW = 256;

async function fixture() {
  return {
    mock: await ethers.deployContract('$Blockhash'),
    systemSigner: await impersonate(SYSTEM_ADDRESS),
    latestBlock: await ethers.provider.getBlock('latest'),
  };
}

describe('Blockhash', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const supported of [true, false]) {
    describe(`${supported ? 'supported' : 'unsupported'} chain`, function () {
      beforeEach(async function () {
        if (supported) {
          await this.systemSigner.sendTransaction({ to: predeploy.eip2935, data: this.latestBlock.hash });
        } else {
          await setCode(predeploy.eip2935.target, '0x');
        }
      });

      it('recent block', async function () {
        // fast forward (less than blockhash serve window)
        await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW);
        await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(this.latestBlock.hash);
      });

      it('old block', async function () {
        // fast forward (more than blockhash serve window)
        await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW + 1);
        await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(
          supported ? this.latestBlock.hash : ethers.ZeroHash,
        );
      });

      it('very old block', async function () {
        // fast forward (more than history serve window)
        await mineUpTo(this.latestBlock.number + HISTORY_SERVE_WINDOW + 10);
        await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(ethers.ZeroHash);
      });

      it('future block', async function () {
        // check history access in the future
        await expect(this.mock.$blockHash(this.latestBlock.number + 10)).to.eventually.equal(ethers.ZeroHash);
      });
    });
  }
});
