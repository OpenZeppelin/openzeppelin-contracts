require('@openzeppelin/test-helpers');

const NoncesImpl = artifacts.require('NoncesImpl');

contract('Nonces', function (accounts) {
  const [ sender, other ] = accounts;

  beforeEach(async function () {
    this.nonces = await NoncesImpl.new();
  });

  it('gets a nonce', async function () {
    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');
  });

  it('increment a nonce', async function () {
    await this.nonces.useNonce(sender);
    expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
  });

  it('nonce is specific to address argument', async function () {
    await this.nonces.useNonce(sender);
    expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');
  });
});
