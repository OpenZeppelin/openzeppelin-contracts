const expectEvent = require('@openzeppelin/test-helpers/src/expectEvent');
const { expectRevertCustomError } = require('../helpers/customError');

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

  describe('_useNonce', function () {
    it('increments a nonce', async function () {
      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');

      const { receipt } = await this.nonces.$_useNonce(sender);
      expectEvent(receipt, 'return$_useNonce', ['0']);

      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
    });

    it("increments only sender's nonce", async function () {
      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('0');
      expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');

      await this.nonces.$_useNonce(sender);

      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
      expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');
    });
  });

  describe('_useCheckedNonce', function () {
    it('increments a nonce', async function () {
      const currentNonce = await this.nonces.nonces(sender);
      expect(currentNonce).to.be.bignumber.equal('0');

      await this.nonces.$_useCheckedNonce(sender, currentNonce);

      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
    });

    it("increments only sender's nonce", async function () {
      const currentNonce = await this.nonces.nonces(sender);

      expect(currentNonce).to.be.bignumber.equal('0');
      expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');

      await this.nonces.$_useCheckedNonce(sender, currentNonce);

      expect(await this.nonces.nonces(sender)).to.be.bignumber.equal('1');
      expect(await this.nonces.nonces(other)).to.be.bignumber.equal('0');
    });

    it('reverts when nonce is not the expected', async function () {
      const currentNonce = await this.nonces.nonces(sender);
      await expectRevertCustomError(
        this.nonces.$_useCheckedNonce(sender, currentNonce.addn(1)),
        'InvalidAccountNonce',
        [sender, currentNonce],
      );
    });
  });
});
