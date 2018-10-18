const encodeCall = require('zos-lib/lib/helpers/encodeCall').default;
const { shouldBehaveLikeERC20Mintable } = require('../token/ERC20/behaviors/ERC20Mintable.behavior');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const StandardToken = artifacts.require('StandardToken');

contract('StandardToken', function ([
  _, deployer, initialHolder, minterA, minterB, pauserA, pauserB, anyone, ...otherAccounts
]) {
  const name = 'StdToken';
  const symbol = 'STDT';
  const decimals = 18;

  const initialSupply = 300;

  const minters = [minterA, minterB];
  const pausers = [pauserA, pauserB];

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.token = await StandardToken.new({ from: deployer });
  });

  async function initialize (token, name, symbol, decimals, initialSupply, initialHolder, minters, pausers, from) {
    const callData = encodeCall('initialize',
      ['string', 'string', 'uint8', 'uint256', 'address', 'address[]', 'address[]'],
      [name, symbol, decimals, initialSupply, initialHolder, minters, pausers]);
    await token.sendTransaction({ data: callData, from });
  }

  context('with all arguments', function () {
    beforeEach(async function () {
      await initialize(this.token, name, symbol, decimals, initialSupply, initialHolder, minters, pausers, deployer);
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

  it('can be created with zero initial balance', async function () {
    await initialize(this.token, name, symbol, decimals, 0, ZERO_ADDRESS, minters, pausers, deployer);
    (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(0);
  });

  it('can be created with no minters', async function () {
    await initialize(this.token, name, symbol, decimals, initialSupply, initialHolder, [], pausers, deployer);

    for (const minter of minters) {
      (await this.token.isMinter(minter)).should.equal(false);
    }
  });

  it('can be created with no pausers', async function () {
    await initialize(this.token, name, symbol, decimals, initialSupply, initialHolder, minters, [], deployer);

    for (const pauser of pausers) {
      (await this.token.isPauser(pauser)).should.equal(false);
    }
  });
});
