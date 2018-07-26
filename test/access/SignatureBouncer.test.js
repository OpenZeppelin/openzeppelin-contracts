const { assertRevert } = require('../helpers/assertRevert');
const { getBouncerSigner } = require('../helpers/sign');

const Bouncer = artifacts.require('SignatureBouncerMock');

require('chai')
  .should();

const UINT_VALUE = 23;
const BYTES_VALUE = web3.toHex('test');
const INVALID_SIGNATURE = '0xabcd';

contract('Bouncer', ([_, owner, anyone, bouncerAddress, authorizedUser]) => {
  beforeEach(async function () {
    this.bouncer = await Bouncer.new({ from: owner });
    this.roleBouncer = await this.bouncer.ROLE_BOUNCER();
  });

  context('management', () => {
    it('has a default owner of self', async function () {
      (await this.bouncer.owner()).should.eq(owner);
    });

    it('allows the owner to add a bouncer', async function () {
      await this.bouncer.addBouncer(bouncerAddress, { from: owner });
      (await this.bouncer.hasRole(bouncerAddress, this.roleBouncer)).should.eq(true);
    });

    it('does not allow adding an invalid address', async function () {
      await assertRevert(
        this.bouncer.addBouncer('0x0', { from: owner })
      );
    });

    it('allows the owner to remove a bouncer', async function () {
      await this.bouncer.addBouncer(bouncerAddress, { from: owner });

      await this.bouncer.removeBouncer(bouncerAddress, { from: owner });
      (await this.bouncer.hasRole(bouncerAddress, this.roleBouncer)).should.eq(false);
    });

    it('does not allow anyone to add a bouncer', async function () {
      await assertRevert(
        this.bouncer.addBouncer(bouncerAddress, { from: anyone })
      );
    });

    it('does not allow anyone to remove a bouncer', async function () {
      await this.bouncer.addBouncer(bouncerAddress, { from: owner });

      await assertRevert(
        this.bouncer.removeBouncer(bouncerAddress, { from: anyone })
      );
    });
  });

  context('with bouncer address', () => {
    beforeEach(async function () {
      await this.bouncer.addBouncer(bouncerAddress, { from: owner });
      this.signFor = getBouncerSigner(this.bouncer, bouncerAddress);
    });

    describe('modifiers', () => {
      context('plain signature', () => {
        it('allows valid signature for sender', async function () {
          await this.bouncer.onlyWithValidSignature(this.signFor(authorizedUser), { from: authorizedUser });
        });

        it('does not allow invalid signature for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignature(INVALID_SIGNATURE, { from: authorizedUser })
          );
        });

        it('does not allow valid signature for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignature(this.signFor(authorizedUser), { from: anyone })
          );
        });

        it('does not allow valid signature for method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignature(this.signFor(authorizedUser, 'onlyWithValidSignature'),
              { from: authorizedUser })
          );
        });
      });

      context('method signature', () => {
        it('allows valid signature with correct method for sender', async function () {
          await this.bouncer.onlyWithValidSignatureAndMethod(
            this.signFor(authorizedUser, 'onlyWithValidSignatureAndMethod'), { from: authorizedUser }
          );
        });

        it('does not allow invalid signature with correct method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(INVALID_SIGNATURE, { from: authorizedUser })
          );
        });

        it('does not allow valid signature with correct method for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(
              this.signFor(authorizedUser, 'onlyWithValidSignatureAndMethod'), { from: anyone }
            )
          );
        });

        it('does not allow valid method signature with incorrect method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(this.signFor(authorizedUser, 'theWrongMethod'),
              { from: authorizedUser })
          );
        });

        it('does not allow valid non-method signature method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(this.signFor(authorizedUser), { from: authorizedUser })
          );
        });
      });

      context('method and data signature', () => {
        it('allows valid signature with correct method and data for sender', async function () {
          await this.bouncer.onlyWithValidSignatureAndData(UINT_VALUE,
            this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]), { from: authorizedUser }
          );
        });

        it('does not allow invalid signature with correct method and data for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(UINT_VALUE, INVALID_SIGNATURE, { from: authorizedUser })
          );
        });

        it('does not allow valid signature with correct method and incorrect data for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(UINT_VALUE + 10,
              this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]),
              { from: authorizedUser }
            )
          );
        });

        it('does not allow valid signature with correct method and data for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(UINT_VALUE,
              this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]),
              { from: anyone }
            )
          );
        });

        it('does not allow valid non-method signature for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(UINT_VALUE,
              this.signFor(authorizedUser), { from: authorizedUser }
            )
          );
        });
      });
    });

    context('signature validation', () => {
      context('plain signature', () => {
        it('validates valid signature for valid user', async function () {
          (await this.bouncer.checkValidSignature(authorizedUser, this.signFor(authorizedUser))).should.eq(true);
        });

        it('does not validate invalid signature for valid user', async function () {
          (await this.bouncer.checkValidSignature(authorizedUser, INVALID_SIGNATURE)).should.eq(false);
        });

        it('does not validate valid signature for anyone', async function () {
          (await this.bouncer.checkValidSignature(anyone, this.signFor(authorizedUser))).should.eq(false);
        });

        it('does not validate valid signature for method for valid user', async function () {
          (await this.bouncer.checkValidSignature(authorizedUser, this.signFor(authorizedUser, 'checkValidSignature'))
          ).should.eq(false);
        });
      });

      context('method signature', () => {
        it('validates valid signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser,
            this.signFor(authorizedUser, 'checkValidSignatureAndMethod'))
          ).should.eq(true);
        });

        it('does not validate invalid signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser, INVALID_SIGNATURE)).should.eq(false);
        });

        it('does not validate valid signature with correct method for anyone', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(anyone,
            this.signFor(authorizedUser, 'checkValidSignatureAndMethod'))
          ).should.eq(false);
        });

        it('does not validate valid non-method signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser, this.signFor(authorizedUser))
          ).should.eq(false);
        });
      });

      context('method and data signature', () => {
        it('validates valid signature with correct method and data for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE,
            this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
          ).should.eq(true);
        });

        it('does not validate invalid signature with correct method and data for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE, INVALID_SIGNATURE)
          ).should.eq(false);
        });

        it('does not validate valid signature with correct method and incorrect data for valid user',
          async function () {
            (await this.bouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE + 10,
              this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
            ).should.eq(false);
          }
        );

        it('does not validate valid signature with correct method and data for anyone', async function () {
          (await this.bouncer.checkValidSignatureAndData(anyone, BYTES_VALUE, UINT_VALUE,
            this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
          ).should.eq(false);
        });

        it('does not validate valid non-method-data signature with correct method and data for valid user',
          async function () {
            (await this.bouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE,
              this.signFor(authorizedUser, 'checkValidSignatureAndData'))
            ).should.eq(false);
          }
        );
      });
    });
  });
});
