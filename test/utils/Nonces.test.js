const expectEvent = require('@openzeppelin/test-helpers/src/expectEvent');

require('@openzeppelin/test-helpers');

const Nonces = artifacts.require('$Nonces');

contract('Nonces', function (accounts) {
  const [sender, other] = accounts;

  beforeEach(async function () {
    this.nonces = await Nonces.new();
  });

  it('gets a nonce', async function () {
    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');
  });

  it('increment a nonce', async function () {
    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');

    const { receipt } = await this.nonces.$_useNonce(sender);
    expectEvent(receipt, 'return$_useNonce', { current: '0' });

    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
  });

  it('nonce is specific to address argument', async function () {
    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');
    expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');

    await this.nonces.$_useNonce(sender);

    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
    expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');
  });
});
