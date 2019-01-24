const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');

const { shouldFail, BN } = require('openzeppelin-test-helpers');

const StandaloneERC20 = artifacts.require('StandaloneERC20');

contract('StandaloneERC20', function ([
  _, deployer, initialHolder, minterA, minterB, pauserA, pauserB, anyone, ...otherAccounts
]) {
  const name = 'StandaloneERC20';
  const symbol = 'SAERC20';
  const decimals = new BN(18);

  const initialSupply = new BN(300);

  const minters = [minterA, minterB];
  const pausers = [pauserA, pauserB];

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await StandaloneERC20.new({ from: deployer });
  });

  async function initializeFull (token, name, symbol, decimals, initialSupply, initialHolder, minters, pausers, from) {
    const signature = 'initialize(string,string,uint8,uint256,address,address[],address[],address)';
    const args = [name, symbol, decimals, initialSupply, initialHolder, minters, pausers, from];
    await token.methods[signature](...args, { from });
  }

  async function initializePartial (token, name, symbol, decimals, minters, pausers, from) {
    const signature = 'initialize(string,string,uint8,address[],address[],address)';
    const args = [name, symbol, decimals, minters, pausers, from];
    await token.methods[signature](...args, { from });
  }

  describe('with all arguments', function () {
    it('reverts if initial balance is zero', async function () {
      await shouldFail.reverting(
        initializeFull(this.token, name, symbol, decimals, 0, ZERO_ADDRESS, minters, pausers, deployer)
      );
    });

    it('can be created with no minters', async function () {
      await initializeFull(this.token, name, symbol, decimals, initialSupply, initialHolder, [], pausers, deployer);

      for (const minter of minters) {
        (await this.token.isMinter(minter)).should.equal(false);
      }
    });

    it('can be created with no pausers', async function () {
      await initializeFull(this.token, name, symbol, decimals, initialSupply, initialHolder, minters, [], deployer);

      for (const pauser of pausers) {
        (await this.token.isPauser(pauser)).should.equal(false);
      }
    });

    context('with token', async function () {
      beforeEach(async function () {
        await initializeFull(
          this.token, name, symbol, decimals, initialSupply, initialHolder, minters, pausers, deployer
        );
      });

      it('initializes metadata', async function () {
        (await this.token.name()).should.equal(name);
        (await this.token.symbol()).should.equal(symbol);
        (await this.token.decimals()).should.be.bignumber.equal(decimals);
      });

      it('assigns the initial supply to the initial holder', async function () {
        (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply);
      });

      describe('mintability', function () {
        beforeEach(function () {
          this.contract = this.token;
        });

        it('all minters have the minter role', async function () {
          for (const minter of minters) {
            (await this.token.isMinter(minter)).should.equal(true);
          }
        });

        shouldBehaveLikeERC20Mintable(minterA, otherAccounts);
      });

      describe('pausability', function () {
        beforeEach(function () {
          this.contract = this.token;
        });

        it('all pausers have the minter role', async function () {
          for (const pauser of pausers) {
            (await this.token.isPauser(pauser)).should.equal(true);
          }
        });
      });
    });
  });

  describe('without initial balance', function () {
    it('can be created with no minters', async function () {
      await initializePartial(this.token, name, symbol, decimals, [], pausers, deployer);

      for (const minter of minters) {
        (await this.token.isMinter(minter)).should.equal(false);
      }
    });

    it('can be created with no pausers', async function () {
      await initializePartial(this.token, name, symbol, decimals, minters, [], deployer);

      for (const pauser of pausers) {
        (await this.token.isPauser(pauser)).should.equal(false);
      }
    });

    context('with token', async function () {
      beforeEach(async function () {
        await initializePartial(this.token, name, symbol, decimals, minters, pausers, deployer);
      });

      it('initializes metadata', async function () {
        (await this.token.name()).should.equal(name);
        (await this.token.symbol()).should.equal(symbol);
        (await this.token.decimals()).should.be.bignumber.equal(decimals);
      });

      describe('mintability', function () {
        beforeEach(function () {
          this.contract = this.token;
        });

        it('all minters have the minter role', async function () {
          for (const minter of minters) {
            (await this.token.isMinter(minter)).should.equal(true);
          }
        });

        shouldBehaveLikeERC20Mintable(minterA, otherAccounts);
      });

      describe('pausability', function () {
        beforeEach(function () {
          this.contract = this.token;
        });

        it('all pausers have the minter role', async function () {
          for (const pauser of pausers) {
            (await this.token.isPauser(pauser)).should.equal(true);
          }
        });
      });
    });
  });
});
