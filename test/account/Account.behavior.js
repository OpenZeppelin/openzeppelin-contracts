const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { impersonate } = require('../helpers/account');
const { SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILURE } = require('../helpers/erc4337');
const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeAccountCore() {
  describe('entryPoint', function () {
    it('should return the canonical entrypoint', async function () {
      await this.mock.deploy();
      await expect(this.mock.entryPoint()).to.eventually.equal(predeploy.entrypoint.v09);
    });
  });

  describe('validateUserOp', function () {
    beforeEach(async function () {
      await this.other.sendTransaction({ to: this.mock.target, value: ethers.parseEther('1') });
      await this.mock.deploy();
      this.userOp ??= {};
    });

    it('should revert if the caller is not the canonical entrypoint', async function () {
      // empty operation (does nothing)
      const operation = await this.mock.createUserOp(this.userOp).then(op => this.signUserOp(op));

      await expect(this.mock.connect(this.other).validateUserOp(operation.packed, operation.hash(), 0))
        .to.be.revertedWithCustomError(this.mock, 'AccountUnauthorized')
        .withArgs(this.other);
    });

    describe('when the caller is the canonical entrypoint', function () {
      beforeEach(async function () {
        this.mockFromEntrypoint = this.mock.connect(await impersonate(predeploy.entrypoint.v09.target));
      });

      it('should return SIG_VALIDATION_SUCCESS if the signature is valid', async function () {
        // empty operation (does nothing)
        const operation = await this.mock.createUserOp(this.userOp).then(op => this.signUserOp(op));

        expect(await this.mockFromEntrypoint.validateUserOp.staticCall(operation.packed, operation.hash(), 0)).to.eq(
          SIG_VALIDATION_SUCCESS,
        );
      });

      it('should return SIG_VALIDATION_FAILURE if the signature is invalid', async function () {
        // empty operation (does nothing)
        const operation = await this.mock.createUserOp(this.userOp);
        operation.signature = (await this.invalidSig?.()) ?? '0x00';

        expect(await this.mockFromEntrypoint.validateUserOp.staticCall(operation.packed, operation.hash(), 0)).to.eq(
          SIG_VALIDATION_FAILURE,
        );
      });

      it('should pay missing account funds for execution', async function () {
        // empty operation (does nothing)
        const operation = await this.mock.createUserOp(this.userOp).then(op => this.signUserOp(op));
        const value = 42n;

        await expect(
          this.mockFromEntrypoint.validateUserOp(operation.packed, operation.hash(), value),
        ).to.changeEtherBalances([this.mock, predeploy.entrypoint.v09], [-value, value]);
      });
    });
  });

  describe('fallback', function () {
    it('should receive ether', async function () {
      await this.mock.deploy();
      const value = 42n;

      await expect(this.other.sendTransaction({ to: this.mock, value })).to.changeEtherBalances(
        [this.other, this.mock],
        [-value, value],
      );
    });
  });
}

function shouldBehaveLikeAccountHolder() {
  describe('onReceived', function () {
    beforeEach(async function () {
      await this.mock.deploy();
    });

    shouldSupportInterfaces(['ERC1155Receiver']);

    describe('onERC1155Received', function () {
      const ids = [1n, 2n, 3n];
      const values = [1000n, 2000n, 3000n];
      const data = '0x12345678';

      beforeEach(async function () {
        this.token = await ethers.deployContract('$ERC1155', ['https://somedomain.com/{id}.json']);
        await this.token.$_mintBatch(this.other, ids, values, '0x');
      });

      it('receives ERC1155 tokens from a single ID', async function () {
        await this.token.connect(this.other).safeTransferFrom(this.other, this.mock, ids[0], values[0], data);

        await expect(
          this.token.balanceOfBatch(
            ids.map(() => this.mock),
            ids,
          ),
        ).to.eventually.deep.equal(values.map((v, i) => (i == 0 ? v : 0n)));
      });

      it('receives ERC1155 tokens from a multiple IDs', async function () {
        await expect(
          this.token.balanceOfBatch(
            ids.map(() => this.mock),
            ids,
          ),
        ).to.eventually.deep.equal(ids.map(() => 0n));

        await this.token.connect(this.other).safeBatchTransferFrom(this.other, this.mock, ids, values, data);
        await expect(
          this.token.balanceOfBatch(
            ids.map(() => this.mock),
            ids,
          ),
        ).to.eventually.deep.equal(values);
      });
    });

    describe('onERC721Received', function () {
      const tokenId = 1n;

      beforeEach(async function () {
        this.token = await ethers.deployContract('$ERC721', ['Some NFT', 'SNFT']);
        await this.token.$_mint(this.other, tokenId);
      });

      it('receives an ERC721 token', async function () {
        await this.token.connect(this.other).safeTransferFrom(this.other, this.mock, tokenId);

        await expect(this.token.ownerOf(tokenId)).to.eventually.equal(this.mock);
      });
    });
  });
}

module.exports = { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder };
