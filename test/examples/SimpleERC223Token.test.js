import expectThrow from '../helpers/expectThrow';
var Token = artifacts.require('SimpleERC223Token');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SimpleERC223Token', function (accounts) {
  const _name = 'SimpleToken';
  const _symbol = 'SIMPLE';
  const _decimals = 8;
  const _supply = 100;
  const _initialSupply = _supply * (10 ** _decimals);
  const _amount = 100;

  describe('Basic information methods', function () {
    it('should return the right name', async function () {
      return Token.deployed().then(function (i) {
        return i.name.call();
      }).then(function (result) {
        result.should.be.equal(_name);
      });
    });

    it('should return the right symbol', async function () {
      return Token.deployed().then(function (i) {
        return i.symbol.call();
      }).then(function (result) {
        result.should.be.equal(_symbol);
      });
    });

    it('should return the right decimal point', async function () {
      return Token.deployed().then(function (i) {
        return i.decimals.call();
      }).then(function (result) {
        result.toNumber().should.be.equal(_decimals);
      });
    });

    it('should return the right total supply', function () {
      return Token.deployed().then(function (i) {
        return i.totalSupply.call();
      }).then(function (result) {
        result.toNumber().should.be.equal(_initialSupply);
      });
    });

    it('should return the balance of an address', function () {
      return Token.deployed().then(function (i) {
        return i.balanceOf.call(accounts[0]);
      }).then(function (result) {
        result.toNumber().should.be.bignumber.equal(_initialSupply);
      });
    });
  });

  describe('Transaction methods', function () {
    it('should succesfully transfer without data (legacy ERC20)', async function () {
      var token;
      var balanceClose;
      var balanceTarget;
      return Token.deployed().then(function (i) {
        token = i;
        return token.transfer.sendTransaction(accounts[1], _amount);
      }).then(function (result) {
        return token.balanceOf.call(accounts[0]);
      }).then(function (result) {
        balanceClose = result.toNumber();
        return token.balanceOf.call(accounts[1]);
      }).then(function (result) {
        balanceTarget = result.toNumber();
      }).then(function () {
        assert.equal(balanceClose, _initialSupply - _amount, 'wrong balance in _from account');
        assert.equal(balanceTarget, _amount, 'wrong balance in _to account');
      });
    });

    it('should succesfully execute oveloaded transfer with data (ERC223)');
    /*
    * Truffle currently does not support calls to overloaded functions:
    * https://github.com/trufflesuite/truffle/issues/569
    * eventually the test should look like:
    *
    * var token;
    * var balanceClose;
    * var balanceTarget;
    * return Token.deployed().then(function(i) {
    *     token = i;
    *     return token.transfer.sendTransaction(accounts[1], _amount, 'data');
    * }).then(function(result) {
    *     return token.balanceOf.call(accounts[0]);
    * }).then(function(result) {
    *     balanceClose = result.toNumber()
    *     return token.balanceOf.call(accounts[1]);
    * }).then(function(result) {
    *     balanceTarget = result.toNumber()
    * }).then(function() {
    *     assert.equal(balanceClose, _initialSupply - _amount, "wrong balance in _from account");
    *     assert.equal(balanceTarget, _amount, "wrong balance in _to account");
    * })
    */

    it('should revert if trying to transfer with a non-existent fallback function');
    /*
    * Truffle currently does not support calls to overloaded functions:
    * https://github.com/trufflesuite/truffle/issues/569
    * eventually the test should look like:
    *
    * return Token.deployed().then(function (i) {
    *    expectThrow(i.transfer.sendTransaction(accounts[1], _amount, '0x', 'customfallback'));
    *  });
    * });
    */

    it('emits a transfer event', async function () {
      return Token.deployed().then(function (i) {
        i.transfer.sendTransaction(accounts[1], _amount);
      }).then(function (events) {
        console.log(events);
      });
    });

    it('should throw when trying to transfer to 0x0', async function () {
      return Token.deployed().then(function (i) {
        expectThrow(i.transfer(0x0, _amount));
      });
    });

    it('should throw an error when trying to transfer more than balance', async function () {
      return Token.deployed().then(function (i) {
        var balance = i.balanceOf(accounts[0]);
        expectThrow(i.transfer(accounts[1], balance + 1));
      });
    });

    it('should throw an error when trying to transfer less than 0', async function () {
      return Token.deployed().then(function (i) {
        expectThrow(i.transfer(accounts[1], -1));
      });
    });
  });
});
