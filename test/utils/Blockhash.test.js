const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine, mineUpTo, setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../helpers/account');

async function fixture() {
  const mock = await ethers.deployContract('$Blockhash');
  return { mock };
}

const HISTORY_STORAGE_ADDRESS = '0x0000F90827F1C53a10cb7A02335B175320002935';
const SYSTEM_ADDRESS = '0xfffffffffffffffffffffffffffffffffffffffe';
const HISTORY_SERVE_WINDOW = 8191;
const BLOCKHASH_SERVE_WINDOW = 256;

describe('Blockhash', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));

    impersonate(SYSTEM_ADDRESS);
    this.systemSigner = await ethers.getSigner(SYSTEM_ADDRESS);
  });

  it('recent block', async function () {
    await mine();

    const mostRecentBlock = (await ethers.provider.getBlock('latest')).number;
    const blockToCheck = mostRecentBlock - 1;
    const fetchedHash = (await ethers.provider.getBlock(blockToCheck)).hash;
    await expect(this.mock.$blockHash(blockToCheck)).to.eventually.equal(fetchedHash);
  });

  it('old block', async function () {
    await mine();

    const mostRecentBlock = await ethers.provider.getBlock('latest');

    // Call the history address with the most recent block hash
    await this.systemSigner.sendTransaction({
      to: HISTORY_STORAGE_ADDRESS,
      data: mostRecentBlock.hash,
    });

    await mineUpTo(mostRecentBlock.number + BLOCKHASH_SERVE_WINDOW + 10);

    // Verify blockhash after setting history
    await expect(this.mock.$blockHash(mostRecentBlock.number)).to.eventually.equal(mostRecentBlock.hash);
  });

  it('very old block', async function () {
    await mine();

    const mostRecentBlock = await ethers.provider.getBlock('latest');
    await mineUpTo(mostRecentBlock.number + HISTORY_SERVE_WINDOW + 10);

    await expect(this.mock.$blockHash(mostRecentBlock.number)).to.eventually.equal(ethers.ZeroHash);
  });

  it('future block', async function () {
    await mine();

    const mostRecentBlock = await ethers.provider.getBlock('latest');
    const blockToCheck = mostRecentBlock.number + 10;
    await expect(this.mock.$blockHash(blockToCheck)).to.eventually.equal(ethers.ZeroHash);
  });

  it('unsupported chain', async function () {
    await setCode(HISTORY_STORAGE_ADDRESS, '0x00');

    const mostRecentBlock = await ethers.provider.getBlock('latest');
    await mineUpTo(mostRecentBlock.number + BLOCKHASH_SERVE_WINDOW + 10);

    await expect(this.mock.$blockHash(mostRecentBlock.number)).to.eventually.equal(ethers.ZeroHash);
    await expect(this.mock.$blockHash(mostRecentBlock.number + 20)).to.eventually.not.equal(ethers.ZeroHash);
  });
});
