const { assertRevert } = require('../helpers/assertRevert');
const { signHex } = require('../helpers/sign');

const Bouncer = artifacts.require('SignatureBouncerMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

function getSigner (contract, signer, data = '') {
  return (addr) => {
    // via: https://github.com/OpenZeppelin/zeppelin-solidity/pull/812/files
    const message = contract.address.substr(2) + addr.substr(2) + data;
    // ^ substr to remove `0x` because in solidity the address is a set of byes, not a string `0xabcd`
    return signHex(signer, message);
  }
};

function getMethodId (methodName, ...paramTypes) {
  // methodId is a sha3 of the first 4 bytes after 0x of 'method(paramType1,...)'
  return web3.sha3(`${methodName}(${paramTypes.join(',')})`).substr(2, 8);
};

function stripAndPadHexValue (hexVal, sizeInBytes, start = true) {
  // strip 0x from the font and pad with 0's for
  const strippedHexVal = hexVal.substr(2);
  return start ? strippedHexVal.padStart(sizeInBytes * 2, 0) : strippedHexVal.padEnd(sizeInBytes * 2, 0);
};

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
    });

    describe('modifiers', () => {
      beforeEach(async function () {
        this.uintValue = 42; // Used to call the method

        this.plainSigner = getSigner(this.bouncer, bouncerAddress);
        this.methodSigner = getSigner(this.bouncer, bouncerAddress, getMethodId('onlyWithValidSignatureAndMethod', 'bytes'));
        this.methodDataSigner = getSigner(this.bouncer, bouncerAddress, [
            getMethodId('onlyWithValidSignatureAndData', 'uint256', 'bytes'),
            stripAndPadHexValue(web3.toHex(this.uintValue), 32),
            stripAndPadHexValue(web3.toHex(64), 32),
          ].join('')
        );
      });

      context('plain signature', () => {
        it('allows valid signature for sender', async function () {
          await this.bouncer.onlyWithValidSignature(this.plainSigner(authorizedUser), { from: authorizedUser });
        });

        it('does not allow invalid signature for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignature('abcd', { from: authorizedUser })
          );
        });

        it('does not allow valid signature for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignature(this.plainSigner(authorizedUser), { from: anyone })
          );
        });

        it('does not allow valid signature for method for sender', async function () {
          const signer = getSigner(this.bouncer, bouncerAddress, getMethodId('onlyWithValidSignature', 'bytes'));
          await assertRevert(
            this.bouncer.onlyWithValidSignature(signer(authorizedUser), { from: authorizedUser })
          );
        });
      });

      context('method signature', () => {
        it('allows valid signature with correct method for sender', async function () {
          await this.bouncer.onlyWithValidSignatureAndMethod(this.methodSigner(authorizedUser), { from: authorizedUser });
          });

        it('does not allow invalid signature with correct method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod('abcd', { from: authorizedUser })
          );
        });

        it('does not allow valid signature with correct method for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(this.methodSigner(authorizedUser), { from: anyone })
          );
        });

        it('does not allow valid non-method signature method for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndMethod(this.plainSigner(authorizedUser), { from: authorizedUser })
          );
        });
      });

      context('method and data signature', () => {
        it('allows valid signature with correct method and data for sender', async function () {
          await this.bouncer.onlyWithValidSignatureAndData(this.uintValue, this.methodDataSigner(authorizedUser), { from: authorizedUser });
        });

        it('does not allow invalid signature with correct method and data for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(this.uintValue, 'abcd', { from: authorizedUser })
          );
        });

        it('does not allow valid signature with correct method and incorrect data for sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(this.uintValue + 10, this.methodDataSigner(authorizedUser), { from: authorizedUser })
          );
        });

        it('does not allow valid signature with correct method and data for other sender', async function () {
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(this.uintValue, this.methodDataSigner(authorizedUser), { from: anyone })
          );
        });

        it('does not allow valid non-data signature with correct method for sender', async function () {
          const signer = getSigner(this.bouncer, bouncerAddress, getMethodId('onlyWithValidSignatureAndData', 'uint256', 'bytes'));
          await assertRevert(
            this.bouncer.onlyWithValidSignatureAndData(this.uintValue, signer(authorizedUser), { from: authorizedUser })
          );
        });
      });
    });

    context('signature validation', () => {
      beforeEach(async function () {
        // Values used to call the method
        this.uintValue = 42;
        this.bytesValue = web3.toHex('bytesValue');

        this.plainSigner = getSigner(this.bouncer, bouncerAddress);
        this.methodSigner = getSigner(this.bouncer, bouncerAddress, getMethodId('checkValidSignatureAndMethod', 'address', 'bytes'));
        this.methodDataSigner = (user) => {
          const signer = getSigner(this.bouncer, bouncerAddress, [
              getMethodId('checkValidSignatureAndData', 'address', 'bytes', 'uint256', 'bytes'),
              stripAndPadHexValue(user, 32),
              stripAndPadHexValue(web3.toHex(32 * 4), 32), // bytesValue location
              stripAndPadHexValue(web3.toHex(this.uintValue), 32),
              stripAndPadHexValue(web3.toHex(32 * 6), 32), // sig location
              stripAndPadHexValue(web3.toHex(this.bytesValue.substr(2).length / 2), 32), // bytesValue size
              stripAndPadHexValue(this.bytesValue, 32, false), // bytesValue
            ].join('')
          );

          return signer(user);
        }
      });

      context('plain signature', () => {
        it('validates valid signature for valid user', async function () {
          (await this.bouncer.checkValidSignature(authorizedUser, this.plainSigner(authorizedUser))).should.eq(true);
        });

        it('does not validate invalid signature for valid user', async function () {
          (await this.bouncer.checkValidSignature(authorizedUser, 'abcd')).should.eq(false);
        });

        it('does not validate valid signature for anyone', async function () {
          (await this.bouncer.checkValidSignature(anyone, this.plainSigner(authorizedUser))).should.eq(false);
        });

        it('does not validate valid signature for method for valid user', async function () {
          const signer = getSigner(this.bouncer, bouncerAddress, getMethodId('checkValidSignature', 'address', 'bytes'));
          (await this.bouncer.checkValidSignature(authorizedUser, signer(authorizedUser))).should.eq(false);
        });
      });

      context('method signature', () => {
        it('validates valid signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser, this.methodSigner(authorizedUser))).should.eq(true);
        });

        it('does not validate invalid signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser, 'abcd')).should.eq(false);
        });

        it('does not validate valid signature with correct method for anyone', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(anyone, this.methodSigner(authorizedUser))).should.eq(false);
        });

        it('does not validate valid non-method signature with correct method for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndMethod(authorizedUser, this.plainSigner(authorizedUser))).should.eq(false);
        });
      });

      context('method and data signature', () => {
        it('validates valid signature with correct method and data for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, this.bytesValue, this.uintValue, this.methodDataSigner(authorizedUser))).should.eq(true);
        });

        it('does not validate invalid signature with correct method and data for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, this.bytesValue, this.uintValue, 'abcd')).should.eq(false);
        });

        it('does not validate valid signature with correct method and incorrect data for valid user', async function () {
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, this.bytesValue, this.uintValue + 10, this.methodDataSigner(authorizedUser))).should.eq(false);
        });

        it('does not validate valid signature with correct method and data for anyone', async function () {
          (await this.bouncer.checkValidSignatureAndData(anyone, this.bytesValue, this.uintValue, this.methodDataSigner(authorizedUser))).should.eq(false);
        });

        it('does not validate valid non-method-data signature with correct method and data for valid user', async function () {
          const signer = getSigner(this.bouncer, bouncerAddress, getMethodId('checkValidSignatureAndData', 'address', 'bytes', 'uint256', 'bytes'));
          (await this.bouncer.checkValidSignatureAndData(authorizedUser, this.bytesValue, this.uintValue, signer(authorizedUser))).should.eq(false);
        });
      });
    });
  });
});
