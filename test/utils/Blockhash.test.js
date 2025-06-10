const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mineUpTo, setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../helpers/account');

const HISTORY_STORAGE_ADDRESS = '0x0000F90827F1C53a10cb7A02335B175320002935';
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

  describe('supported chain', function () {
    beforeEach(async function () {
      await this.systemSigner.sendTransaction({ to: HISTORY_STORAGE_ADDRESS, data: this.latestBlock.hash });
    });

    it('recent block', async function () {
      // fast forward (less than blockhash serve window)
      await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW - 10);
      await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(this.latestBlock.hash);
    });

    it('old block', async function () {
      // fast forward (more than blockhash serve window)
      await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW + 10);
      await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(this.latestBlock.hash);
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

  describe('unsupported chain', function () {
    beforeEach(async function () {
      await setCode(HISTORY_STORAGE_ADDRESS, '0x00');
    });

    it('recent block', async function () {
      // fast forward (less than blockhash serve window)
      await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW - 10);
      await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(this.latestBlock.hash);
    });

    it('old block', async function () {
      // fast forward (more than blockhash serve window)
      await mineUpTo(this.latestBlock.number + BLOCKHASH_SERVE_WINDOW + 10);
      await expect(this.mock.$blockHash(this.latestBlock.number)).to.eventually.equal(ethers.ZeroHash);
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
});
