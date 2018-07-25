
const { assertRevert } = require('../helpers/assertRevert');
const { getBouncerTicketGenerator } = require('../helpers/sign');
const { makeInterfaceId } = require('../helpers/makeInterfaceId');

const Bouncer = artifacts.require('BouncerMock');
const SignatureDelegateImpl = artifacts.require('SignatureDelegateImpl');

require('chai')
  .use(require('chai-as-promised'))
  .should();

const UINT_VALUE = 23;
const BYTES_VALUE = web3.toHex('test');
const INVALID_SIGNATURE = '0xabcd';

contract('Bouncer', ([_, owner, anyone, delegate, newDelegate]) => {
  beforeEach(async function () {
    this.bouncer = await Bouncer.new({ from: owner });
    this.roleDelegate = await this.bouncer.ROLE_DELEGATE();
    this.roleOwner = await this.bouncer.ROLE_OWNER();
    this.generateTicket = getBouncerTicketGenerator(this.bouncer, delegate);
  });

  it('should have a default owner', async function () {
    const hasRole = await this.bouncer.hasRole(owner, this.roleOwner);
    hasRole.should.eq(true);
  });

  it('should allow owner to add a delegate', async function () {
    await this.bouncer.addDelegate(delegate, { from: owner });
    const hasRole = await this.bouncer.hasRole(delegate, this.roleDelegate);
    hasRole.should.eq(true);
  });

  it('should not allow anyone to add a delegate', async function () {
    await assertRevert(
      this.bouncer.addDelegate(delegate, { from: anyone })
    );
  });

  context('EOA delegate', function () {
    beforeEach(async function () {
      await this.bouncer.addDelegate(delegate, { from: owner });
    });

    context('modifiers', () => {
      it('should allow valid signature', async function () {
        await this.bouncer.onlyWithValidTicket(
          this.generateTicket(),
          { from: anyone }
        );
      });
      it('should not allow invalid signature', async function () {
        await assertRevert(
          this.bouncer.onlyWithValidTicket(
            INVALID_SIGNATURE,
            { from: anyone }
          )
        );
      });
      it('should allow valid signature with a valid method', async function () {
        await this.bouncer.onlyWithValidTicketAndMethod(
          this.generateTicket('onlyWithValidTicketAndMethod'),
          { from: anyone }
        );
      });
      it('should not allow invalid signature with method', async function () {
        await assertRevert(
          this.bouncer.onlyWithValidTicketAndMethod(
            INVALID_SIGNATURE,
            { from: anyone }
          )
        );
      });
      it('should allow valid signature with a valid data', async function () {
        await this.bouncer.onlyWithValidTicketAndData(
          UINT_VALUE,
          this.generateTicket('onlyWithValidTicketAndData', [UINT_VALUE]),
          { from: anyone }
        );
      });
      it('should not allow invalid signature with data', async function () {
        await assertRevert(
          this.bouncer.onlyWithValidTicketAndData(
            UINT_VALUE,
            INVALID_SIGNATURE,
            { from: anyone }
          )
        );
      });
    });

    context('signatures', () => {
      it('should accept valid ticket for valid delegate', async function () {
        const isValid = await this.bouncer.checkValidTicket(
          this.bouncer.address,
          this.generateTicket()
        );
        isValid.should.eq(true);
      });
      it('should not accept invalid ticket for valid delegate', async function () {
        const isValid = await this.bouncer.checkValidTicket(
          this.bouncer.address,
          'abcd'
        );
        isValid.should.eq(false);
      });
      it('should accept valid ticket with valid method', async function () {
        const isValid = await this.bouncer.checkValidTicketAndMethod(
          this.bouncer.address,
          this.generateTicket('checkValidTicketAndMethod')
        );
        isValid.should.eq(true);
      });
      it('should not accept valid message with an invalid method', async function () {
        const isValid = await this.bouncer.checkValidTicketAndMethod(
          this.bouncer.address,
          this.generateTicket('theWrongMethod')
        );
        isValid.should.eq(false);
      });
      it('should not accept valid message with a valid method for an invalid user', async function () {
        const isValid = await this.bouncer.checkValidTicketAndMethod(
          anyone,
          this.generateTicket('checkValidTicketAndMethod')
        );
        isValid.should.eq(false);
      });
      it('should accept valid method with valid params', async function () {
        const isValid = await this.bouncer.checkValidTicketAndData(
          this.bouncer.address,
          BYTES_VALUE,
          UINT_VALUE,
          this.generateTicket('checkValidTicketAndData', [this.bouncer.address, BYTES_VALUE, UINT_VALUE])
        );
        isValid.should.eq(true);
      });
      it('should not accept valid method with invalid params', async function () {
        const isValid = await this.bouncer.checkValidTicketAndData(
          this.bouncer.address,
          BYTES_VALUE,
          500,
          this.generateTicket('checkValidTicketAndData', [this.bouncer.address, BYTES_VALUE, UINT_VALUE])
        );
        isValid.should.eq(false);
      });
      it('should not accept valid method with valid params for invalid delegate', async function () {
        const isValid = await this.bouncer.checkValidTicketAndData(
          anyone,
          BYTES_VALUE,
          UINT_VALUE,
          this.generateTicket('checkValidTicketAndData', [anyone, BYTES_VALUE, UINT_VALUE])
        );
        isValid.should.eq(false);
      });
    });

    context('management', () => {
      it('should not allow anyone to add delegates', async function () {
        await assertRevert(
          this.bouncer.addDelegate(newDelegate, { from: anyone })
        );
      });

      it('should be able to add delegate', async function () {
        await this.bouncer.addDelegate(newDelegate, { from: owner })
          .should.be.fulfilled;
      });

      it('should not allow adding invalid address', async function () {
        await assertRevert(
          this.bouncer.addDelegate('0x0', { from: owner })
        );
      });

      it('should not allow anyone to remove delegate', async function () {
        await assertRevert(
          this.bouncer.removeDelegate(newDelegate, { from: anyone })
        );
      });

      it('should be able to remove delegates', async function () {
        await this.bouncer.removeDelegate(newDelegate, { from: owner })
          .should.be.fulfilled;
      });
    });
  });

  context('contract delegate', () => {
    context('not a delegate', () => {
      beforeEach(async function () {
        this.delegateContract = await SignatureDelegateImpl.new(true, this.bouncer.address, { from: owner });
      });

      it('should fail', async function () {
        await assertRevert(
          this.delegateContract.forward({ from: anyone })
        );
      });
    });

    context('invalid delegate', () => {
      beforeEach(async function () {
        this.delegateContract = await SignatureDelegateImpl.new(false, this.bouncer.address, { from: owner });
        await this.bouncer.addDelegate(this.delegateContract.address, { from: owner });
      });

      it('should be invalid', async function () {
        await assertRevert(
          this.delegateContract.forward({ from: anyone })
        );
      });
    });

    context('valid delegate', () => {
      beforeEach(async function () {
        this.delegateContract = await SignatureDelegateImpl.new(true, this.bouncer.address, { from: owner });
        await this.bouncer.addDelegate(this.delegateContract.address, { from: owner });
      });

      it('should support isValidSignature', async function () {
        const supported = await this.delegateContract.supportsInterface(makeInterfaceId([
          'isValidSignature(bytes32,bytes)',
        ]));
        supported.should.eq(true);
      });

      it('should be valid', async function () {
        await this.delegateContract.forward({ from: anyone });
      });
    });
  });
});
