
import assertRevert from '../helpers/assertRevert';
import { signHex } from '../helpers/sign';

const Bouncer = artifacts.require('SignatureBouncerMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

export const getSigner = (contract, signer, data = '') => (addr) => {
  // via: https://github.com/OpenZeppelin/zeppelin-solidity/pull/812/files
  const message = contract.address.substr(2) + addr.substr(2) + data;
  // ^ substr to remove `0x` because in solidity the address is a set of byes, not a string `0xabcd`
  return signHex(signer, message);
};

contract('Bouncer', ([_, owner, authorizedUser, anyone, bouncerAddress, newBouncer]) => {
  before(async function () {
    this.bouncer = await Bouncer.new({ from: owner });
    this.roleBouncer = await this.bouncer.ROLE_BOUNCER();
    this.genSig = getSigner(this.bouncer, bouncerAddress);
  });

  it('should have a default owner of self', async function () {
    const theOwner = await this.bouncer.owner();
    theOwner.should.eq(owner);
  });

  it('should allow owner to add a bouncer', async function () {
    await this.bouncer.addBouncer(bouncerAddress, { from: owner });
    const hasRole = await this.bouncer.hasRole(bouncerAddress, this.roleBouncer);
    hasRole.should.eq(true);
  });

  it('should not allow anyone to add a bouncer', async function () {
    await assertRevert(
      this.bouncer.addBouncer(bouncerAddress, { from: anyone })
    );
  });

  context('modifiers', () => {
    it('should allow valid signature for sender', async function () {
      await this.bouncer.onlyWithValidSignature(
        this.genSig(authorizedUser),
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignature(
          'abcd',
          { from: authorizedUser }
        )
      );
    });
  });

  context('signatures', () => {
    it('should accept valid message for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        authorizedUser,
        this.genSig(authorizedUser)
      );
      isValid.should.eq(true);
    });
    it('should not accept invalid message for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        authorizedUser,
        this.genSig(anyone)
      );
      isValid.should.eq(false);
    });
    it('should not accept invalid message for invalid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        anyone,
        'abcd'
      );
      isValid.should.eq(false);
    });
    it('should not accept valid message for invalid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        anyone,
        this.genSig(authorizedUser)
      );
      isValid.should.eq(false);
    });
  });

  context('management', () => {
    it('should not allow anyone to add bouncers', async function () {
      await assertRevert(
        this.bouncer.addBouncer(newBouncer, { from: anyone })
      );
    });

    it('should be able to add bouncers', async function () {
      await this.bouncer.addBouncer(newBouncer, { from: owner })
        .should.be.fulfilled;
    });

    it('should not allow adding invalid address', async function () {
      await assertRevert(
        this.bouncer.addBouncer('0x0', { from: owner })
      );
    });

    it('should not allow anyone to remove bouncer', async function () {
      await assertRevert(
        this.bouncer.removeBouncer(newBouncer, { from: anyone })
      );
    });

    it('should be able to remove bouncers', async function () {
      await this.bouncer.removeBouncer(newBouncer, { from: owner })
        .should.be.fulfilled;
    });
  });
});
