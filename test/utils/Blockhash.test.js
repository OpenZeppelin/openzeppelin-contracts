const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mineUpTo, setCode, setStorageAt } = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../helpers/account');

const SYSTEM_ADDRESS = '0xfffffffffffffffffffffffffffffffffffffffe';
const HISTORY_SERVE_WINDOW = 8191;
const BLOCKHASH_SERVE_WINDOW = 256;

const makeBlockHeader = ({ blockNumber, extraFields = [] }) =>
  ethers.encodeRlp([
    ethers.randomBytes(32),
    ethers.randomBytes(32),
    ethers.randomBytes(20),
    ethers.randomBytes(32),
    ethers.randomBytes(32),
    ethers.randomBytes(32),
    ethers.randomBytes(256),
    ethers.toBeHex(1),
    ethers.toBeHex(blockNumber),
    ethers.toBeHex(30_000_000),
    '0x',
    ethers.toBeHex(1_700_000_000),
    '0x',
    ethers.randomBytes(32),
    ethers.randomBytes(8),
    ...extraFields,
  ]);

const historySlot = blockNumber => ethers.toBeHex(BigInt(blockNumber % HISTORY_SERVE_WINDOW), 32);

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

      it('extracts block number from an RLP header', async function () {
        const header = makeBlockHeader({ blockNumber: this.latestBlock.number, extraFields: [ethers.toBeHex(7)] });
        await expect(this.mock.$blockNumber(header)).to.eventually.equal(this.latestBlock.number);
      });

      it('verifies an RLP header against recorded history', async function () {
        const targetBlock = this.latestBlock.number;
        const header = makeBlockHeader({
          blockNumber: targetBlock,
          extraFields: [ethers.toBeHex(7), ethers.toBeHex(9)],
        });
        const headerHash = ethers.keccak256(header);

        await setStorageAt(predeploy.eip2935.target, historySlot(targetBlock), headerHash);
        await mineUpTo(targetBlock + BLOCKHASH_SERVE_WINDOW + 1);

        await expect(this.mock.$verifyBlockHeader(header)).to.eventually.equal(supported);
      });

      if (supported) {
        it('rejects a mismatched RLP header hash', async function () {
          const targetBlock = this.latestBlock.number;
          const header = makeBlockHeader({ blockNumber: targetBlock });

          await setStorageAt(predeploy.eip2935.target, historySlot(targetBlock), ethers.keccak256('0x1234'));
          await mineUpTo(targetBlock + BLOCKHASH_SERVE_WINDOW + 1);

          await expect(this.mock.$verifyBlockHeader(header)).to.eventually.equal(false);
        });
      }
    });
  }
});
