const encodeCall = require('zos-lib/lib/helpers/encodeCall').default;

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const StandaloneERC721 = artifacts.require('StandaloneERC721');

contract('StandaloneERC721', function ([_, deployer, minterA, minterB, pauserA, pauserB, anyone, ...otherAccounts]) {
  const name = 'StandaloneERC721';
  const symbol = 'SAERC721';

  const minters = [minterA, minterB];
  const pausers = [pauserA, pauserB];

  beforeEach(async function () {
    this.token = await StandaloneERC721.new({ from: deployer });
  });

  async function initialize (token, name, symbol, minters, pausers, from) {
    const callData = encodeCall('initialize',
      ['string', 'string', 'address[]', 'address[]'],
      [name, symbol, minters, pausers]);
    await token.sendTransaction({ data: callData, from });
  }

  it('can be created with no minters', async function () {
    await initialize(this.token, name, symbol, [], pausers, deployer);

    for (const minter of minters) {
      (await this.token.isMinter(minter)).should.equal(false);
    }
  });

  it('can be created with no pausers', async function () {
    await initialize(this.token, name, symbol, minters, [], deployer);

    for (const pauser of pausers) {
      (await this.token.isPauser(pauser)).should.equal(false);
    }
  });

  context('with token', async function () {
    beforeEach(async function () {
      await initialize(this.token, name, symbol, minters, pausers, deployer);
    });

    it('initializes metadata', async function () {
      (await this.token.name()).should.equal(name);
      (await this.token.symbol()).should.equal(symbol);
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
