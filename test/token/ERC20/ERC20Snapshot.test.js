const ERC20Snapshot = artifacts.require('ERC20SnapshotMock');
const { expectThrow } = require('../../helpers/expectThrow');
const { EVMRevert } = require('../../helpers/EVMRevert');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC20Snapshot', function ([_, owner, recipient, spender]) {
  beforeEach(async function () {
    this.token = await ERC20Snapshot.new(owner, 100);
  });

  context('there is no snapshots yet', function () {
    describe('balanceOfAt', function () {
      it('rejected for snapshotId parameter equals to 0', async function () {
        await expectThrow(
          this.token.balanceOfAt(owner, 0),
          EVMRevert,
        );
      });

      it('rejected for snapshotId parameter greather than currentSnapshotId', async function () {
        await expectThrow(
          this.token.balanceOfAt(owner, 1),
          EVMRevert,
        );
      });
    });

    describe('after transfer', function () {
      beforeEach(async function () {
        await this.token.transfer(recipient, 10, { from: owner });
      });

      it('balanceOf returns correct value', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(90);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(10);
      });

      it('snapshots do not exist', async function () {
        (await this.token.snapshotsLength(owner)).should.be.bignumber.equal(0);
        (await this.token.snapshotsLength(recipient)).should.be.bignumber.equal(0);
      });
    });
  });

  context('snapshots exist', function () {
    beforeEach(async function () {
      await this.token.snapshot();
    });

    describe('accounts do not have snapshots yet', function () {
      it('snapshot value of the owner account equals to his balance', async function () {
        const balanceOfAt = (await this.token.balanceOfAt(owner, 1));
        const balanceOf = (await this.token.balanceOf(owner));
        balanceOfAt.should.be.bignumber.equal(balanceOf);
      });

      it('snapshot value of the recipient account equals to balance', async function () {
        const balanceOfAt = (await this.token.balanceOfAt(recipient, 1));
        const balanceOf = (await this.token.balanceOf(recipient));
        balanceOfAt.should.be.bignumber.equal(balanceOf);
      });
    });

    describe('accounts have already one snapshot', function () {
      beforeEach(async function () {
        await this.token.transfer(recipient, 10, { from: owner });
      });

      it('snapshot keeps previous balance', async function () {
        (await this.token.balanceOfAt(owner, 1)).should.be.bignumber.equal(100);
        (await this.token.balanceOfAt(recipient, 1)).should.be.bignumber.equal(0);
      });

      it('account has correct balance', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(90);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(10);
      });
    });

    describe('snapshot keeps previous balance even for multiple transfers', async function () {
      beforeEach(async function () {
        await this.token.transfer(recipient, 10, { from: owner });
        await this.token.transfer(recipient, 10, { from: owner });
      });

      it('snapshot has previous balance', async function () {
        (await this.token.balanceOfAt(owner, 1)).should.be.bignumber.equal(100);
        (await this.token.balanceOfAt(recipient, 1)).should.be.bignumber.equal(0);
      });

      it('account has correct balance', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(80);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(20);
      });
    });

    describe('snapshot keeps correct values for transfer from action', async function () {
      beforeEach(async function () {
        await this.token.approve(spender, 20, { from: owner });
        await this.token.transferFrom(owner, recipient, 20, { from: spender });
      });

      it('spender and recipient snapshot is stored', async function () {
        (await this.token.balanceOfAt(owner, 1)).should.be.bignumber.equal(100);
        (await this.token.balanceOfAt(recipient, 1)).should.be.bignumber.equal(0);
      });
    });
  });
});
