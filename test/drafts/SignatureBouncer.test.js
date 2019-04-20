const { shouldFail } = require('openzeppelin-test-helpers');
const { getSignFor } = require('../helpers/sign');
const { shouldBehaveLikePublicRole } = require('../behaviors/access/roles/PublicRole.behavior');

const SignatureBouncerMock = artifacts.require('SignatureBouncerMock');

const UINT_VALUE = 23;
const BYTES_VALUE = web3.utils.toHex('test');
const INVALID_SIGNATURE = '0xabcd';

contract('SignatureBouncer', function ([_, signer, otherSigner, other, authorizedUser, ...otherAccounts]) {
  beforeEach(async function () {
    this.sigBouncer = await SignatureBouncerMock.new({ from: signer });
    this.signFor = getSignFor(this.sigBouncer, signer);
  });

  describe('signer role', function () {
    beforeEach(async function () {
      this.contract = this.sigBouncer;
      await this.contract.addSigner(otherSigner, { from: signer });
    });

    shouldBehaveLikePublicRole(signer, otherSigner, otherAccounts, 'signer');
  });

  describe('modifiers', function () {
    context('plain signature', function () {
      it('allows valid signature for sender', async function () {
        await this.sigBouncer.onlyWithValidSignature(await this.signFor(authorizedUser), { from: authorizedUser });
      });

      it('does not allow invalid signature for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignature(INVALID_SIGNATURE, { from: authorizedUser }),
          'SignatureBouncer: invalid signature for caller'
        );
      });

      it('does not allow valid signature for other sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignature(await this.signFor(authorizedUser), { from: other }),
          'SignatureBouncer: invalid signature for caller'
        );
      });

      it('does not allow valid signature for method for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignature(await this.signFor(authorizedUser, 'onlyWithValidSignature'),
            { from: authorizedUser }), 'SignatureBouncer: invalid signature for caller'
        );
      });
    });

    context('method signature', function () {
      it('allows valid signature with correct method for sender', async function () {
        await this.sigBouncer.onlyWithValidSignatureAndMethod(
          await this.signFor(authorizedUser, 'onlyWithValidSignatureAndMethod'), { from: authorizedUser }
        );
      });

      it('does not allow invalid signature with correct method for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndMethod(INVALID_SIGNATURE, { from: authorizedUser }),
          'SignatureBouncer: invalid signature for caller and method'
        );
      });

      it('does not allow valid signature with correct method for other sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndMethod(
            await this.signFor(authorizedUser, 'onlyWithValidSignatureAndMethod'), { from: other }
          ),
          'SignatureBouncer: invalid signature for caller and method'
        );
      });

      it('does not allow valid method signature with incorrect method for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndMethod(await this.signFor(authorizedUser, 'theWrongMethod'),
            { from: authorizedUser }), 'SignatureBouncer: invalid signature for caller and method'
        );
      });

      it('does not allow valid non-method signature method for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndMethod(await this.signFor(authorizedUser), { from: authorizedUser }),
          'SignatureBouncer: invalid signature for caller and method'
        );
      });
    });

    context('method and data signature', function () {
      it('allows valid signature with correct method and data for sender', async function () {
        await this.sigBouncer.onlyWithValidSignatureAndData(UINT_VALUE,
          await this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]), { from: authorizedUser }
        );
      });

      it('does not allow invalid signature with correct method and data for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndData(UINT_VALUE, INVALID_SIGNATURE, { from: authorizedUser }),
          'SignatureBouncer: invalid signature for caller and data'
        );
      });

      it('does not allow valid signature with correct method and incorrect data for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndData(UINT_VALUE + 10,
            await this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]),
            { from: authorizedUser }
          ), 'SignatureBouncer: invalid signature for caller and data'
        );
      });

      it('does not allow valid signature with correct method and data for other sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndData(UINT_VALUE,
            await this.signFor(authorizedUser, 'onlyWithValidSignatureAndData', [UINT_VALUE]),
            { from: other }
          ), 'SignatureBouncer: invalid signature for caller and data'
        );
      });

      it('does not allow valid non-method signature for sender', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.onlyWithValidSignatureAndData(UINT_VALUE,
            await this.signFor(authorizedUser), { from: authorizedUser }
          ), 'SignatureBouncer: invalid signature for caller and data'
        );
      });

      it('does not allow msg.data shorter than SIGNATURE_SIZE', async function () {
        await shouldFail.reverting.withMessage(
          this.sigBouncer.tooShortMsgData({ from: authorizedUser }), 'SignatureBouncer: data is too short'
        );
      });
    });
  });

  context('signature validation', function () {
    context('plain signature', function () {
      it('validates valid signature for valid user', async function () {
        (await this.sigBouncer.checkValidSignature(authorizedUser, await this.signFor(authorizedUser)))
          .should.equal(true);
      });

      it('does not validate invalid signature for valid user', async function () {
        (await this.sigBouncer.checkValidSignature(authorizedUser, INVALID_SIGNATURE)).should.equal(false);
      });

      it('does not validate valid signature for anyone', async function () {
        (await this.sigBouncer.checkValidSignature(other, await this.signFor(authorizedUser))).should.equal(false);
      });

      it('does not validate valid signature for method for valid user', async function () {
        (await this.sigBouncer.checkValidSignature(
          authorizedUser, await this.signFor(authorizedUser, 'checkValidSignature'))
        ).should.equal(false);
      });
    });

    context('method signature', function () {
      it('validates valid signature with correct method for valid user', async function () {
        (await this.sigBouncer.checkValidSignatureAndMethod(authorizedUser,
          await this.signFor(authorizedUser, 'checkValidSignatureAndMethod'))
        ).should.equal(true);
      });

      it('does not validate invalid signature with correct method for valid user', async function () {
        (await this.sigBouncer.checkValidSignatureAndMethod(authorizedUser, INVALID_SIGNATURE)).should.equal(false);
      });

      it('does not validate valid signature with correct method for anyone', async function () {
        (await this.sigBouncer.checkValidSignatureAndMethod(other,
          await this.signFor(authorizedUser, 'checkValidSignatureAndMethod'))
        ).should.equal(false);
      });

      it('does not validate valid non-method signature with correct method for valid user', async function () {
        (await this.sigBouncer.checkValidSignatureAndMethod(authorizedUser, await this.signFor(authorizedUser))
        ).should.equal(false);
      });
    });

    context('method and data signature', function () {
      it('validates valid signature with correct method and data for valid user', async function () {
        (await this.sigBouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE,
          await this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
        ).should.equal(true);
      });

      it('does not validate invalid signature with correct method and data for valid user', async function () {
        (await this.sigBouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE, INVALID_SIGNATURE)
        ).should.equal(false);
      });

      it('does not validate valid signature with correct method and incorrect data for valid user',
        async function () {
          (await this.sigBouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE + 10,
            await this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
          ).should.equal(false);
        }
      );

      it('does not validate valid signature with correct method and data for anyone', async function () {
        (await this.sigBouncer.checkValidSignatureAndData(other, BYTES_VALUE, UINT_VALUE,
          await this.signFor(authorizedUser, 'checkValidSignatureAndData', [authorizedUser, BYTES_VALUE, UINT_VALUE]))
        ).should.equal(false);
      });

      it('does not validate valid non-method-data signature with correct method and data for valid user',
        async function () {
          (await this.sigBouncer.checkValidSignatureAndData(authorizedUser, BYTES_VALUE, UINT_VALUE,
            await this.signFor(authorizedUser, 'checkValidSignatureAndData'))
          ).should.equal(false);
        }
      );
    });
  });
});
