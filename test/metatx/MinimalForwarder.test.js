const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { getDomain, domainType } = require('../helpers/eip712');

const { expectRevert, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MinimalForwarder = artifacts.require('MinimalForwarder');
const CallReceiverMock = artifacts.require('CallReceiverMock');

contract('MinimalForwarder', function (accounts) {
  beforeEach(async function () {
    this.forwarder = await MinimalForwarder.new();

    this.domain = await getDomain(this.forwarder);
    this.types = {
      EIP712Domain: domainType(this.domain),
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
    };
  });

  context('with message', function () {
    beforeEach(async function () {
      this.wallet = Wallet.generate();
      this.sender = web3.utils.toChecksumAddress(this.wallet.getAddressString());
      this.req = {
        from: this.sender,
        to: constants.ZERO_ADDRESS,
        value: '0',
        gas: '100000',
        nonce: Number(await this.forwarder.getNonce(this.sender)),
        data: '0x',
      };
      this.sign = () =>
        ethSigUtil.signTypedMessage(this.wallet.getPrivateKey(), {
          data: {
            types: this.types,
            domain: this.domain,
            primaryType: 'ForwardRequest',
            message: this.req,
          },
        });
    });

    context('verify', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from)).to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });

        it('success', async function () {
          expect(await this.forwarder.verify(this.req, this.sign())).to.be.equal(true);
        });

        afterEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from)).to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });
      });

      context('invalid signature', function () {
        it('tampered from', async function () {
          expect(await this.forwarder.verify({ ...this.req, from: accounts[0] }, this.sign())).to.be.equal(false);
        });
        it('tampered to', async function () {
          expect(await this.forwarder.verify({ ...this.req, to: accounts[0] }, this.sign())).to.be.equal(false);
        });
        it('tampered value', async function () {
          expect(await this.forwarder.verify({ ...this.req, value: web3.utils.toWei('1') }, this.sign())).to.be.equal(
            false,
          );
        });
        it('tampered nonce', async function () {
          expect(await this.forwarder.verify({ ...this.req, nonce: this.req.nonce + 1 }, this.sign())).to.be.equal(
            false,
          );
        });
        it('tampered data', async function () {
          expect(await this.forwarder.verify({ ...this.req, data: '0x1742' }, this.sign())).to.be.equal(false);
        });
        it('tampered signature', async function () {
          const tamperedsign = web3.utils.hexToBytes(this.sign());
          tamperedsign[42] ^= 0xff;
          expect(await this.forwarder.verify(this.req, web3.utils.bytesToHex(tamperedsign))).to.be.equal(false);
        });
      });
    });

    context('execute', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from)).to.be.bignumber.equal(web3.utils.toBN(this.req.nonce));
        });

        it('success', async function () {
          await this.forwarder.execute(this.req, this.sign()); // expect to not revert
        });

        afterEach(async function () {
          expect(await this.forwarder.getNonce(this.req.from)).to.be.bignumber.equal(
            web3.utils.toBN(this.req.nonce + 1),
          );
        });
      });

      context('invalid signature', function () {
        it('tampered from', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, from: accounts[0] }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered to', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, to: accounts[0] }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered value', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, value: web3.utils.toWei('1') }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered nonce', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, nonce: this.req.nonce + 1 }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered data', async function () {
          await expectRevert(
            this.forwarder.execute({ ...this.req, data: '0x1742' }, this.sign()),
            'MinimalForwarder: signature does not match request',
          );
        });
        it('tampered signature', async function () {
          const tamperedsign = web3.utils.hexToBytes(this.sign());
          tamperedsign[42] ^= 0xff;
          await expectRevert(
            this.forwarder.execute(this.req, web3.utils.bytesToHex(tamperedsign)),
            'MinimalForwarder: signature does not match request',
          );
        });
      });

      it('bubble out of gas', async function () {
        const receiver = await CallReceiverMock.new();
        const gasAvailable = 100000;
        this.req.to = receiver.address;
        this.req.data = receiver.contract.methods.mockFunctionOutOfGas().encodeABI();
        this.req.gas = 1000000;

        await expectRevert.assertion(this.forwarder.execute(this.req, this.sign(), { gas: gasAvailable }));

        const { transactions } = await web3.eth.getBlock('latest');
        const { gasUsed } = await web3.eth.getTransactionReceipt(transactions[0]);

        expect(gasUsed).to.be.equal(gasAvailable);
      });
    });
  });
});
