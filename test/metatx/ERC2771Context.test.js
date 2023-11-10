const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { getDomain } = require('../helpers/eip712');
const { MAX_UINT48 } = require('../helpers/constants');

const { shouldBehaveLikeRegularContext } = require('../utils/Context.behavior');

async function fixture() {
  const [trustedForwarderEOA, sender] = await ethers.getSigners();

  const forwarder = await ethers.deployContract('ERC2771Forwarder', []);
  const recipient = await ethers.deployContract('ERC2771ContextMock', [forwarder]);
  const caller = await ethers.deployContract('ContextMockCaller', []);
  const recipientFromEOA = await ethers.deployContract('ERC2771ContextMock', [trustedForwarderEOA]);
  const domain = await getDomain(forwarder);

  return { trustedForwarderEOA, sender, forwarder, recipient, caller, recipientFromEOA, domain };
}

describe('ERC2771Context', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
    this.types = {
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint48' },
        { name: 'data', type: 'bytes' },
      ],
    };
  });

  it('recognize trusted forwarder', async function () {
    expect(await this.recipient.isTrustedForwarder(this.forwarder)).to.equal(true);
  });

  it('returns the trusted forwarder', async function () {
    expect(await this.recipient.trustedForwarder()).to.equal(this.forwarder.target);
  });

  context('when called directly', function () {
    beforeEach(function () {
      this.context = this.recipient; // The Context behavior expects the contract in this.context
    });

    shouldBehaveLikeRegularContext();
  });

  context('when receiving a relayed call', function () {
    describe('msgSender', function () {
      it('returns the relayed transaction original sender', async function () {
        const data = this.recipient.interface.encodeFunctionData(this.recipient.msgSender.fragment, []);

        const req = {
          from: this.sender.address,
          to: this.recipient.target,
          value: '0',
          gas: '100000',
          nonce: await this.forwarder.nonces(this.sender),
          deadline: MAX_UINT48,
          data,
        };

        req.signature = await this.sender.signTypedData(this.domain, this.types, req);

        expect(await this.forwarder.verify(req)).to.equal(true);

        await expect(this.forwarder.execute(req)).to.emit(this.recipient, 'Sender').withArgs(this.sender.address);
      });

      it('returns the original sender when calldata length is less than 20 bytes (address length)', async function () {
        // The forwarder doesn't produce calls with calldata length less than 20 bytes so `this.trustedForwarderEOA` is used instead.
        await expect(this.recipientFromEOA.connect(this.trustedForwarderEOA).msgSender())
          .to.emit(this.recipientFromEOA, 'Sender')
          .withArgs(this.trustedForwarderEOA.address);
      });
    });

    describe('msgData', function () {
      it('returns the relayed transaction original data', async function () {
        const integerValue = '42';
        const stringValue = 'OpenZeppelin';
        const data = this.recipient.interface.encodeFunctionData(this.recipient.msgData.fragment, [
          integerValue,
          stringValue,
        ]);

        const req = {
          from: this.sender.address,
          to: this.recipient.target,
          value: '0',
          gas: '100000',
          nonce: await this.forwarder.nonces(this.sender),
          deadline: MAX_UINT48,
          data,
        };

        req.signature = await this.sender.signTypedData(this.domain, this.types, req);
        expect(await this.forwarder.verify(req)).to.equal(true);

        await expect(this.forwarder.execute(req))
          .to.emit(this.recipient, 'Data')
          .withArgs(data, integerValue, stringValue);
      });
    });

    it('returns the full original data when calldata length is less than 20 bytes (address length)', async function () {
      // The forwarder doesn't produce calls with calldata length less than 20 bytes so `this.trustedForwarderEOA` is used instead.
      const data = this.recipient.interface.encodeFunctionData(this.recipient.msgDataShort.fragment, []);
      await expect(this.recipientFromEOA.connect(this.trustedForwarderEOA).msgDataShort())
        .to.emit(this.recipientFromEOA, 'DataShort')
        .withArgs(data);
    });
  });
});
