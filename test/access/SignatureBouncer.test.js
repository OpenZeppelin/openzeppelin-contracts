
import assertRevert from '../helpers/assertRevert';
import { getBouncerSigner } from '../helpers/sign';

const SignatureBouncer = artifacts.require('SignatureBouncerMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

const UINT_VALUE = 23;
const BYTES_VALUE = web3.toHex('test');
const INVALID_SIGNATURE = '0xabcd';

contract('Bouncer', ([_, owner, authorizedUser, anyone, bouncerAddress, newBouncer]) => {
  before(async function () {
    this.bouncer = await SignatureBouncer.new({ from: owner });
    this.roleBouncer = await this.bouncer.ROLE_BOUNCER();
    this.roleOwner = await this.bouncer.ROLE_OWNER();
    this.signFor = getBouncerSigner(this.bouncer, bouncerAddress);
  });

  it('should have a default owner', async function () {
    const hasRole = await this.bouncer.hasRole(owner, this.roleOwner);
    hasRole.should.eq(true);
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
        this.signFor(authorizedUser),
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignature(
          INVALID_SIGNATURE,
          { from: authorizedUser }
        )
      );
    });
    it('should allow valid signature with a valid method for sender', async function () {
      await this.bouncer.onlyWithValidSignatureAndMethod(
        this.signFor(authorizedUser, 'onlyWithValidSignatureAndMethod'),
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature with method for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignatureAndMethod(
          INVALID_SIGNATURE,
          { from: authorizedUser }
        )
      );
    });
    it('should allow valid signature with a valid data for sender', async function () {
      await this.bouncer.onlyWithValidSignatureAndData(
        UINT_VALUE,
        this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]),
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature with data for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignatureAndData(
          UINT_VALUE,
          INVALID_SIGNATURE,
          { from: authorizedUser }
        )
      );
    });
  });

  context('signatures', () => {
    it('should accept valid message for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        authorizedUser,
        this.signFor(authorizedUser)
      );
      isValid.should.eq(true);
    });
    it('should not accept invalid message for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignature(
        authorizedUser,
        this.signFor(anyone)
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
        this.signFor(authorizedUser)
      );
      isValid.should.eq(false);
    });
    it('should accept valid message with valid method for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        authorizedUser,
        this.signFor(authorizedUser, 'checkValidSignatureAndMethod')
      );
      isValid.should.eq(true);
    });
    it('should not accept valid message with an invalid method for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        authorizedUser,
        this.signFor(authorizedUser, 'theWrongMethod')
      );
      isValid.should.eq(false);
    });
    it('should not accept valid message with a valid method for an invalid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        anyone,
        this.signFor(authorizedUser, 'checkValidSignatureAndMethod')
      );
      isValid.should.eq(false);
    });
    it('should accept valid method with valid params for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndData(
        authorizedUser,
        BYTES_VALUE,
        UINT_VALUE,
        this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE])
      );
      isValid.should.eq(true);
    });
    it('should not accept valid method with invalid params for valid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndData(
        authorizedUser,
        BYTES_VALUE,
        500,
        this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE])
      );
      isValid.should.eq(false);
    });
    it('should not accept valid method with valid params for invalid user', async function () {
      const isValid = await this.bouncer.checkValidSignatureAndData(
        anyone,
        BYTES_VALUE,
        UINT_VALUE,
        this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE])
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
