const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const PausableCrowdsale = contract.fromArtifact('PausableCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('PausableCrowdsale', function () {
  const [ pauser, wallet, other ] = accounts;

  const rate = new BN(1);
  const value = new BN(1);

  beforeEach(async function () {
    const from = pauser;

    this.token = await SimpleToken.new({ from });
    this.crowdsale = await PausableCrowdsale.new(rate, wallet, this.token.address, { from });
    await this.token.transfer(this.crowdsale.address, value.muln(2), { from });
  });

  it('purchases work', async function () {
    await this.crowdsale.sendTransaction({ from: other, value });
    await this.crowdsale.buyTokens(other, { from: other, value });
  });

  context('after pause', function () {
    beforeEach(async function () {
      await this.crowdsale.pause({ from: pauser });
    });

    it('purchases do not work', async function () {
      await expectRevert(this.crowdsale.sendTransaction({ from: other, value }),
        'Pausable: paused'
      );
      await expectRevert(this.crowdsale.buyTokens(other, { from: other, value }),
        'Pausable: paused'
      );
    });

    context('after unpause', function () {
      beforeEach(async function () {
        await this.crowdsale.unpause({ from: pauser });
      });

      it('purchases work', async function () {
        await this.crowdsale.sendTransaction({ from: other, value });
        await this.crowdsale.buyTokens(other, { from: other, value });
      });
    });
  });
});
