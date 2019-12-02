const { accounts, contract } = require('@openzeppelin/test-environment');

const { balance, constants, ether, expectRevert, send } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const AddressImpl = contract.fromArtifact('AddressImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');
const EtherReceiver = contract.fromArtifact('EtherReceiverMock');

describe('Address', function () {
  const [ recipient, other ] = accounts;

  const ALL_ONES_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';

  beforeEach(async function () {
    this.mock = await AddressImpl.new();
  });

  describe('isContract', function () {
    it('should return false for account address', async function () {
      expect(await this.mock.isContract(other)).to.equal(false);
    });

    it('should return true for contract address', async function () {
      const contract = await SimpleToken.new();
      expect(await this.mock.isContract(contract.address)).to.equal(true);
    });
  });

  describe('toPayable', function () {
    it('should return a payable address when the account is the zero address', async function () {
      expect(await this.mock.toPayable(constants.ZERO_ADDRESS)).to.equal(constants.ZERO_ADDRESS);
    });

    it('should return a payable address when the account is an arbitrary address', async function () {
      expect(await this.mock.toPayable(other)).to.equal(other);
    });

    it('should return a payable address when the account is the all ones address', async function () {
      expect(await this.mock.toPayable(ALL_ONES_ADDRESS)).to.equal(ALL_ONES_ADDRESS);
    });
  });

  describe('sendValue', function () {
    beforeEach(async function () {
      this.recipientTracker = await balance.tracker(recipient);
    });

    context('when sender contract has no funds', function () {
      it('sends 0 wei', async function () {
        await this.mock.sendValue(other, 0);

        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('reverts when sending non-zero amounts', async function () {
        await expectRevert(this.mock.sendValue(other, 1), 'Address: insufficient balance');
      });
    });

    context('when sender contract has funds', function () {
      const funds = ether('1');
      beforeEach(async function () {
        await send.ether(other, this.mock.address, funds);
      });

      it('sends 0 wei', async function () {
        await this.mock.sendValue(recipient, 0);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal('0');
      });

      it('sends non-zero amounts', async function () {
        await this.mock.sendValue(recipient, funds.subn(1));
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds.subn(1));
      });

      it('sends the whole balance', async function () {
        await this.mock.sendValue(recipient, funds);
        expect(await this.recipientTracker.delta()).to.be.bignumber.equal(funds);
        expect(await balance.current(this.mock.address)).to.be.bignumber.equal('0');
      });

      it('reverts when sending more than the balance', async function () {
        await expectRevert(this.mock.sendValue(recipient, funds.addn(1)), 'Address: insufficient balance');
      });

      context('with contract recipient', function () {
        beforeEach(async function () {
          this.contractRecipient = await EtherReceiver.new();
        });

        it('sends funds', async function () {
          const tracker = await balance.tracker(this.contractRecipient.address);

          await this.contractRecipient.setAcceptEther(true);
          await this.mock.sendValue(this.contractRecipient.address, funds);
          expect(await tracker.delta()).to.be.bignumber.equal(funds);
        });

        it('reverts on recipient revert', async function () {
          await this.contractRecipient.setAcceptEther(false);
          await expectRevert(
            this.mock.sendValue(this.contractRecipient.address, funds),
            'Address: unable to send value, recipient may have reverted'
          );
        });
      });
    });
  });
});
