const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../helpers/account');
const { getDomain, ForwardRequest } = require('../helpers/eip712');
const { MAX_UINT48 } = require('../helpers/constants');

const { shouldBehaveLikeRegularContext } = require('../utils/Context.behavior');

async function fixture() {
  const [sender, other] = await ethers.getSigners();

  const forwarder = await ethers.deployContract('ERC2771Forwarder', ['ERC2771Forwarder']);
  const forwarderAsSigner = await impersonate(forwarder.target);
  const context = await ethers.deployContract('ERC2771ContextMock', [forwarder]);
  const domain = await getDomain(forwarder);

  const prepareAndSignRequest = async (signer, request) => {
    // request.to is mandatory
    request.from ??= signer.address;
    request.value ??= 0n;
    request.data ??= '0x';
    request.gas ??= 100000n;
    request.nonce ??= await forwarder.nonces(signer);
    request.deadline ??= MAX_UINT48;
    request.signature = await signer.signTypedData(domain, { ForwardRequest }, request);
    return request;
  };

  return { sender, other, forwarder, forwarderAsSigner, context, prepareAndSignRequest };
}

describe('ERC2771Context', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('recognize trusted forwarder', async function () {
    await expect(this.context.isTrustedForwarder(this.forwarder)).to.eventually.be.true;
  });

  it('returns the trusted forwarder', async function () {
    await expect(this.context.trustedForwarder()).to.eventually.equal(this.forwarder);
  });

  describe('when called directly', function () {
    shouldBehaveLikeRegularContext();
  });

  describe('when receiving a relayed call', function () {
    describe('msgSender', function () {
      it('returns the relayed transaction original sender', async function () {
        const req = await this.prepareAndSignRequest(this.sender, {
          to: this.context.target,
          data: this.context.interface.encodeFunctionData('msgSender'),
        });

        await expect(this.forwarder.verify(req)).to.eventually.be.true;
        await expect(this.forwarder.execute(req)).to.emit(this.context, 'Sender').withArgs(this.sender);
      });

      it('returns the original sender when calldata length is less than 20 bytes (address length)', async function () {
        // The forwarder doesn't produce calls with calldata length less than 20 bytes so `this.forwarderAsSigner` is used instead.
        await expect(this.context.connect(this.forwarderAsSigner).msgSender())
          .to.emit(this.context, 'Sender')
          .withArgs(this.forwarder);
      });
    });

    describe('msgData', function () {
      it('returns the relayed transaction original data', async function () {
        const args = [42n, 'OpenZeppelin'];

        const req = await this.prepareAndSignRequest(this.sender, {
          to: this.context.target,
          data: this.context.interface.encodeFunctionData('msgData', args),
        });

        await expect(this.forwarder.verify(req)).to.eventually.be.true;
        await expect(this.forwarder.execute(req))
          .to.emit(this.context, 'Data')
          .withArgs(req.data, ...args);
      });
    });

    it('returns the full original data when calldata length is less than 20 bytes (address length)', async function () {
      const data = this.context.interface.encodeFunctionData('msgDataShort');

      // The forwarder doesn't produce calls with calldata length less than 20 bytes so `this.forwarderAsSigner` is used instead.
      await expect(this.context.connect(this.forwarderAsSigner).msgDataShort())
        .to.emit(this.context, 'DataShort')
        .withArgs(data);
    });
  });

  it('multicall poison attack', async function () {
    const req = await this.prepareAndSignRequest(this.sender, {
      to: this.context.target,
      data: this.context.interface.encodeFunctionData('multicall', [
        // poisonned call to 'msgSender()'
        [ethers.concat([this.context.interface.encodeFunctionData('msgSender'), this.other.address])],
      ]),
    });

    await expect(this.forwarder.verify(req)).to.eventually.be.true;
    await expect(this.forwarder.execute(req)).to.emit(this.context, 'Sender').withArgs(this.sender);
  });
});
