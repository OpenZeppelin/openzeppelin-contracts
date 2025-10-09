const { ethers } = require('hardhat');
const { expect } = require('chai');
const { Permit, formatType, getDomain } = require('../../helpers/eip712');
const { ERC7739Signer } = require('../../helpers/erc7739');

function shouldBehaveLikeERC1271({ erc7739 = false } = {}) {
  const MAGIC_VALUE = '0x1626ba7e';

  describe(`supports ERC-${erc7739 ? 7739 : 1271}`, function () {
    beforeEach(async function () {
      // if deploy function is present, check that code is already in place
      if (this.mock.deploy) {
        await ethers.provider.getCode(this.mock.address).then(code => code != '0x' || this.mock.deploy());
      }
      this._signer = erc7739
        ? new ERC7739Signer(this.signer, this.domain ?? (await getDomain(this.mock)))
        : this.signer;
    });

    describe('PersonalSign', function () {
      it('returns true for a valid personal signature', async function () {
        const text = 'Hello, world!';

        const hash = ethers.hashMessage(text);
        const signature = await this._signer.signMessage(text);

        await expect(this.mock.isValidSignature(hash, signature)).to.eventually.equal(MAGIC_VALUE);
      });

      it('returns false for an invalid personal signature', async function () {
        const message = 'Message the app expects';
        const otherMessage = 'Message signed is different';

        const hash = ethers.hashMessage(message);
        const signature = await this._signer.signMessage(otherMessage);

        await expect(this.mock.isValidSignature(hash, signature)).to.eventually.not.equal(MAGIC_VALUE);
      });
    });

    describe('TypedDataSign', function () {
      beforeEach(async function () {
        // Dummy app domain, different from the ERC7739's domain
        // Note the difference of format (signer domain doesn't include a salt, but app domain does)
        this.appDomain = {
          name: 'SomeApp',
          version: '1',
          chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId),
          verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
          salt: '0x02cb3d8cb5e8928c9c6de41e935e16a4e28b2d54e7e7ba47e99f16071efab785',
        };
      });

      it('returns true for a valid typed data signature', async function () {
        const contents = {
          owner: '0x1ab5E417d9AF00f1ca9d159007e12c401337a4bb',
          spender: '0xD68E96620804446c4B1faB3103A08C98d4A8F55f',
          value: 1_000_000n,
          nonce: 0n,
          deadline: ethers.MaxUint256,
        };

        const hash = ethers.TypedDataEncoder.hash(this.appDomain, { Permit }, contents);
        const signature = await this._signer.signTypedData(this.appDomain, { Permit }, contents);

        await expect(this.mock.isValidSignature(hash, signature)).to.eventually.equal(MAGIC_VALUE);
      });

      it('returns true for valid typed data signature (nested types)', async function () {
        const contentsTypes = {
          B: formatType({ z: 'Z' }),
          Z: formatType({ a: 'A' }),
          A: formatType({ v: 'uint256' }),
        };

        const contents = { z: { a: { v: 1n } } };

        const hash = ethers.TypedDataEncoder.hash(this.appDomain, contentsTypes, contents);
        const signature = await this._signer.signTypedData(this.appDomain, contentsTypes, contents);

        await expect(this.mock.isValidSignature(hash, signature)).to.eventually.equal(MAGIC_VALUE);
      });

      it('returns false for an invalid typed data signature', async function () {
        const contents = {
          owner: '0x1ab5E417d9AF00f1ca9d159007e12c401337a4bb',
          spender: '0xD68E96620804446c4B1faB3103A08C98d4A8F55f',
          value: 1_000_000n,
          nonce: 0n,
          deadline: ethers.MaxUint256,
        };

        const hash = ethers.TypedDataEncoder.hash(this.appDomain, { Permit }, contents);
        // message signed by the user is for a lower amount.
        const signature = await this._signer.signTypedData(this.appDomain, { Permit }, { ...contents, value: 1_000n });

        await expect(this.mock.isValidSignature(hash, signature)).to.eventually.not.equal(MAGIC_VALUE);
      });
    });

    erc7739 &&
      it('support ERC-7739 detection', async function () {
        const hash = '0x7739773977397739773977397739773977397739773977397739773977397739';
        await expect(this.mock.isValidSignature(hash, '0x')).to.eventually.equal('0x77390001');
      });
  });
}

module.exports = {
  shouldBehaveLikeERC1271,
};
