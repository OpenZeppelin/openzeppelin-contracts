const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, Permit } = require('../../helpers/eip712');
const { PersonalSignHelper, TypedDataSignHelper } = require('../../helpers/erc7739');

// Constant
const MAGIC_VALUE = '0x1626ba7e';

// SignedTypedData helpers for a ERC20Permit application.
const helper = TypedDataSignHelper.from({ Permit });

// Fixture
async function fixture() {
  // Using getSigners fails, probably due to a bad implementation of signTypedData somewhere in hardhat
  const eoa = await ethers.Wallet.createRandom();
  const mock = await ethers.deployContract('$ERC7739SignerMock', [eoa]);
  const domain = await getDomain(mock);

  return { eoa, mock, domain };
}

describe('ERC7739Signer', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('isValidSignature', function () {
    describe('PersonalSign', async function () {
      it('returns true for a valid personal signature', async function () {
        const text = 'Hello, world!';

        const hash = PersonalSignHelper.hash(text);
        const signature = await PersonalSignHelper.sign(this.eoa, text, this.domain);

        expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
      });

      it('returns false for an invalid personal signature', async function () {
        const hash = PersonalSignHelper.hash('Message the app expects');
        const signature = await PersonalSignHelper.sign(this.eoa, 'Message signed is different', this.domain);

        expect(await this.mock.isValidSignature(hash, signature)).to.not.equal(MAGIC_VALUE);
      });
    });

    describe('TypedDataSign', async function () {
      beforeEach(async function () {
        // Dummy app domain, different from the ERC7739Signer's domain
        this.appDomain = {
          name: 'SomeApp',
          version: '1',
          chainId: this.domain.chainId,
          verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        };
        this.appMessage = {
          owner: '0x1ab5E417d9AF00f1ca9d159007e12c401337a4bb',
          spender: '0xD68E96620804446c4B1faB3103A08C98d4A8F55f',
          value: 1_000_000n,
          nonce: 0n,
          deadline: ethers.MaxUint256,
        };
        this.appHash = helper.hash(this.appMessage, this.appDomain);
      });

      it('returns true for a valid typed data signature', async function () {
        const message = TypedDataSignHelper.prepare(this.appMessage, this.domain);
        const signature = await helper.sign(this.eoa, message, this.appDomain);

        expect(await this.mock.isValidSignature(this.appHash, signature)).to.equal(MAGIC_VALUE);
      });

      it('returns false for an invalid typed data signature', async function () {
        // signed message is for a lower value.
        const message = TypedDataSignHelper.prepare({ ...this.appMessage, value: 1n }, this.domain);
        const signature = await helper.sign(this.eoa, message, this.appDomain);

        expect(await this.mock.isValidSignature(this.appHash, signature)).to.not.equal(MAGIC_VALUE);
      });
    });
  });
});
