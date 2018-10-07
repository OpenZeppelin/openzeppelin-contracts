const {assertRevert} = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const ERC777 = artifacts.require('ERC777');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC777', function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await ERC777.new("Test777", "T77", 1, []);
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(0); //TODO update when minting is immplemented
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal(0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(0); //TODO update when minting is immplemented
      });
    });
  });

  describe('granularity', function () {
    it('returns granularity amount of the token', async function () {
      (await this.token.granularity()).should.be.bignumber.equal(1); //TODO update when minting is immplemented
    });

    it('value is set at creation time', async function () {
      let token = await ERC777.new("Test777", "T77", 10, []);
      let granularity = await token.granularity();
      granularity.should.be.bignumber.equal(10);
    });

    it('value is checked to be greater or equal to 1', async function () {
      await assertRevert(ERC777.new("Test777", "T77", 0, []));
    });
  });

  describe('defaultOperators', function () {
    it('returns default operators of the token', async function () {
      (await this.token.defaultOperators()).should.be.an('array').that.is.empty; //TODO update when minting is immplemented
    });

    it('value is set at creation time', async function () {
      let token = await ERC777.new("Test777", "T77", 1, [recipient, anotherAccount]);
      let defaultOps = await token.defaultOperators();
      defaultOps.should.be.an('array').that.has.all.members([recipient, anotherAccount]);
    });
  });

  describe('authorizeOperator', function () {
    it('authorizes operators for holders', async function () {
      let op = recipient;
      let holder = owner;

      const {logs} = await this.token.authorizeOperator(op, {from: holder});
      console.log(logs);
      expectEvent.inLogs(logs, 'AuthorizedOperator', {
        operator: op,
        tokenHolder: holder
      });
    });

    it('authorizes operators only when they are not already authorised', async function () {
      let op = recipient;
      let holder = owner;

      await this.token.authorizeOperator(op, {from: holder});
      await assertRevert(this.token.authorizeOperator(op, {from: holder}));
    });

    it('authorizes operators only when they are not pre-authorised by default', async function () {
      let op = recipient;
      let holder = owner;
      let token = await ERC777.new("Test777", "T77", 1, [op]);

      await assertRevert(token.authorizeOperator(op, {from: holder}));
    });
    //TODO more operator auth related tests
  });
});
