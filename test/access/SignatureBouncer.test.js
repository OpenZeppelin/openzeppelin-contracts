
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

export const getMethodId = (methodName, ...paramTypes) => {
  // methodId is a sha3 of the first 4 bytes after 0x of 'method(paramType1,...)'
  return web3.sha3(`${methodName}(${paramTypes.join(',')})`).substr(2, 8);
};

export const stripAndPadHexValue = (hexVal, sizeInBytes) => {
  // strip 0x from the font and pad with 0's for
  return hexVal.substr(2).padStart(sizeInBytes * 2, 0);
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
    it('should allow valid signature with a valid method for sender', async function () {
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        getMethodId('onlyWithValidSignatureAndMethod', 'bytes')
      )(authorizedUser);
      await this.bouncer.onlyWithValidSignatureAndMethod(
        sig,
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature with method for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignatureAndMethod(
          'abcd',
          { from: authorizedUser }
        )
      );
    });
    it('should allow valid signature with a valid data for sender', async function () {
      const methodId = getMethodId('onlyWithValidSignatureAndData', 'uint256', 'bytes');
      const val = 23;
      const valData = stripAndPadHexValue(web3.toHex(val), 32);
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        `${methodId}${valData}`
      )(authorizedUser);
      await this.bouncer.onlyWithValidSignatureAndData(
        val,
        sig,
        { from: authorizedUser }
      );
    });
    it('should not allow invalid signature with data for sender', async function () {
      await assertRevert(
        this.bouncer.onlyWithValidSignatureAndData(
          23,
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
    it('should accept valid message with valid method for valid user', async function () {
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        getMethodId('checkValidSignatureAndMethod', 'address', 'bytes')
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        authorizedUser,
        sig
      );
      isValid.should.eq(true);
    });
    it('should not accept valid message with an invalid method for valid user', async function () {
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        getMethodId('invalidMethod', 'address', 'bytes')
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        authorizedUser,
        sig
      );
      isValid.should.eq(false);
    });
    it('should not accept valid message with a valid method for an invalid user', async function () {
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        getMethodId('checkValidSignatureAndMethod', 'address', 'bytes')
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndMethod(
        anyone,
        sig
      );
      isValid.should.eq(false);
    });
    it('should accept valid method with valid params for valid user', async function () {
      const methodId = getMethodId('checkValidSignatureAndData', 'address', 'uint256', 'bytes');
      const val = 23;
      const addressData = stripAndPadHexValue(authorizedUser, 32);
      const valData = stripAndPadHexValue(web3.toHex(val), 32);
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        `${methodId}${addressData}${valData}`
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndData(
        authorizedUser,
        val,
        sig
      );
      isValid.should.eq(true);
    });
    it('should not accept an invalid method with valid params for valid user', async function () {
      const methodId = getMethodId('invalidMethod', 'address', 'uint256', 'bytes');
      const val = 23;
      const addressData = stripAndPadHexValue(authorizedUser, 32);
      const valData = stripAndPadHexValue(web3.toHex(val), 32);
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        `${methodId}${addressData}${valData}`
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndData(
        authorizedUser,
        val,
        sig
      );
      isValid.should.eq(false);
    });
    it('should not accept valid method with invalid params for valid user', async function () {
      const methodId = getMethodId('checkValidSignatureAndData', 'address', 'uint256', 'bytes');
      const val = 23;
      const addressData = stripAndPadHexValue(authorizedUser, 32);
      const valData = stripAndPadHexValue(web3.toHex(val), 32);
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        `${methodId}${addressData}${valData}`
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndData(
        authorizedUser,
        500,
        sig
      );
      isValid.should.eq(false);
    });
    it('should not accept valid method with valid params for invalid user', async function () {
      const methodId = getMethodId('checkValidSignatureAndData', 'address', 'uint256', 'bytes');
      const val = 23;
      const addressData = stripAndPadHexValue(authorizedUser, 32);
      const valData = stripAndPadHexValue(web3.toHex(val), 32);
      const sig = getSigner(
        this.bouncer,
        bouncerAddress,
        `${methodId}${addressData}${valData}`
      )(authorizedUser);
      const isValid = await this.bouncer.checkValidSignatureAndData(
        anyone,
        val,
        sig
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
