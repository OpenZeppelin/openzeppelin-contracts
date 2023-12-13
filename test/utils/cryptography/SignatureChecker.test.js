const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const TEST_MESSAGE = ethers.id('OpenZeppelin');
const TEST_MESSAGE_HASH = ethers.hashMessage(TEST_MESSAGE);

const WRONG_MESSAGE = ethers.id('Nope');
const WRONG_MESSAGE_HASH = ethers.hashMessage(WRONG_MESSAGE);

async function fixture() {
  const [signer, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('$SignatureChecker');
  const wallet = await ethers.deployContract('ERC1271WalletMock', [signer]);
  const malicious = await ethers.deployContract('ERC1271MaliciousMock');
  const signature = await signer.signMessage(TEST_MESSAGE);

  return { signer, other, mock, wallet, malicious, signature };
}

describe('SignatureChecker (ERC1271)', function () {
  before('deploying', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('EOA account', function () {
    it('with matching signer and signature', async function () {
      expect(await this.mock.$isValidSignatureNow(this.signer, TEST_MESSAGE_HASH, this.signature)).to.be.true;
    });

    it('with invalid signer', async function () {
      expect(await this.mock.$isValidSignatureNow(this.other, TEST_MESSAGE_HASH, this.signature)).to.be.false;
    });

    it('with invalid signature', async function () {
      expect(await this.mock.$isValidSignatureNow(this.signer, WRONG_MESSAGE_HASH, this.signature)).to.be.false;
    });
  });

  describe('ERC1271 wallet', function () {
    for (const fn of ['isValidERC1271SignatureNow', 'isValidSignatureNow']) {
      describe(fn, function () {
        it('with matching signer and signature', async function () {
          expect(await this.mock.getFunction(`$${fn}`)(this.wallet, TEST_MESSAGE_HASH, this.signature)).to.be.true;
        });

        it('with invalid signer', async function () {
          expect(await this.mock.getFunction(`$${fn}`)(this.mock, TEST_MESSAGE_HASH, this.signature)).to.be.false;
        });

        it('with invalid signature', async function () {
          expect(await this.mock.getFunction(`$${fn}`)(this.wallet, WRONG_MESSAGE_HASH, this.signature)).to.be.false;
        });

        it('with malicious wallet', async function () {
          expect(await this.mock.getFunction(`$${fn}`)(this.malicious, TEST_MESSAGE_HASH, this.signature)).to.be.false;
        });
      });
    }
  });
});
