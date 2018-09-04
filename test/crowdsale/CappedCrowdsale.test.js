const { ether } = require('../helpers/ether');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CappedCrowdsale = artifacts.require('CappedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('CappedCrowdsale', function ([_, wallet]) {
  const rate = new BigNumber(1);
  const cap = ether(100);
  const lessThanCap = ether(60);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new();
  });

  it('rejects a cap of zero', async function () {
    await expectThrow(
      CappedCrowdsale.new(rate, wallet, this.token.address, 0),
      EVMRevert,
    );
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await CappedCrowdsale.new(rate, wallet, this.token.address, cap);
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.send(cap.minus(lessThanCap));
        await this.crowdsale.send(lessThanCap);
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.send(cap);
        await expectThrow(
          this.crowdsale.send(1),
          EVMRevert,
        );
      });

      it('should reject payments that exceed cap', async function () {
        await expectThrow(
          this.crowdsale.send(cap.plus(1)),
          EVMRevert,
        );
      });
    });

    describe('ending', function () {
      it('should not reach cap if sent under cap', async function () {
        await this.crowdsale.send(lessThanCap);
        (await this.crowdsale.capReached()).should.equal(false);
      });

      it('should not reach cap if sent just under cap', async function () {
        await this.crowdsale.send(cap.minus(1));
        (await this.crowdsale.capReached()).should.equal(false);
      });

      it('should reach cap if cap sent', async function () {
        await this.crowdsale.send(cap);
        (await this.crowdsale.capReached()).should.equal(true);
      });
    });
  });
});
