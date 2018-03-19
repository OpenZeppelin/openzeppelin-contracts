import assertRevert from '../../helpers/assertRevert';
import expectThrow from '../../helpers/expectThrow';
const ERC223TestToken = artifacts.require('ERC223TokenMock');
const BigNumber = web3.BigNumber;
import assertRevert from '../../helpers/assertRevert';
import expectThrow from '../../helpers/expectThrow';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC223Token', function (accounts) {
  let token = null;
  
  const _name = 'My Test ERC223 Token';
  const _symbol = 'M223T';
  const _decimals = 8;
  const _supply = 100;
  const _initialSupply = _supply * (10 ** _decimals);
  const _amount = 100;

  beforeEach(async function () {
    token = await ERC223TestToken.new(_name, _symbol, _decimals, _supply);
  });

  describe('Basic information methods', function () {
    it('should return the right name', async function () {
      let name = await token.name();
      name.should.be.equal(_name);
    });

    it('should return the right symbol', async function () {
      let symbol = await token.symbol();
      symbol.should.be.equal(_symbol);
    });

    it('should return the right decimal point', async function () {
      let decimals = await token.decimals();
      decimals.should.be.bignumber.equal(_decimals);
    });
    
    it('should return the right total supply', async function () {
      let supply = await token.totalSupply();
      supply.should.be.bignumber.equal(_initialSupply);
    });
    
    it('should return the balance of an address', async function () {
      let balance = await token.balanceOf(accounts[0]);
      balance.should.be.bignumber.equal(_initialSupply);
    });
  });
  
  describe('Transaction methods', function () {
    it('should succesfully transfer to existing address without data (ERC20)', async function () {
      await token.transfer(accounts[1], _amount);
      let close = await token.balanceOf(accounts[0]);
      let target = await token.balanceOf(accounts[1]);
      close.should.be.bignumber.equal(_initialSupply - _amount);
      target.should.be.bignumber.equal(_amount);
    });

    it('should succesfully transfer to existing address with overload (ERC223)');
    /*
    * Truffle currently does not support calls to overloaded functions:
    * https://github.com/trufflesuite/truffle/issues/569
    * eventually the test should look like:
    *
    * await token.transfer(accounts[1], _amount, 'data');
    * or
    * await token.transfer["address, uint256, bytes"](accounts[1], _amount, 'data');
    *
    * let close = await token.balanceOf(accounts[0]);
    * let target = await token.balanceOf(accounts[1]);
    * close.should.be.bignumber.equal(_initialSupply - _amount);
    * target.should.be.bignumber.equal(_amount);
    */

    it('emits a complete transfer event', async function () {
      const { logs } = await token.transfer(accounts[1], _amount);
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].event).to.equal('Transfer');
      expect(logs[0].args.from).to.equal(accounts[0]);
      expect(logs[0].args.to).to.equal(accounts[1]);
      assert(logs[0].args.value.eq(_amount));
      expect(logs[0].args.data).to.equal('0x');
    });

    it('should throw an error when trying to transfer to 0x0', async function () {
      try {
        await token.transfer(0x0, _amount);
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should throw an error when trying to transfer more than balance', async function () {
      let balance = await token.balanceOf(accounts[0]);
      await expectThrow(token.transfer(accounts[1], balance + 1));
    });

    it('should throw an error when trying to transfer less than 0', async function () {
      await expectThrow(token.transfer(accounts[1], -1));
    });
  });
});