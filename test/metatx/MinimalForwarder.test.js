const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { getDomain, domainType } = require('../helpers/eip712');
const { expectRevertCustomError } = require('../helpers/customError');

const { constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MinimalForwarder = artifacts.require('MinimalForwarder');
const CallReceiverMock = artifacts.require('CallReceiverMock');

contract('MinimalForwarder', function (accounts) {
  beforeEach(async function () {
    this.forwarder = await MinimalForwarder.new('MinimalForwarder', '0.0.1');

    this.domain = await getDomain(this.forwarder);
    this.types = {
      EIP712Domain: domainType(this.domain),
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

  context('with message', function () {
    const tamperedValues = {
      from: accounts[0],
      to: accounts[0],
      value: web3.utils.toWei('1'),
      nonce: 1234,
      data: '0x1742',
      deadline: 0xabcdef,
    };

    beforeEach(async function () {
      this.wallet = Wallet.generate();
      this.sender = web3.utils.toChecksumAddress(this.wallet.getAddressString());
      this.blockNumber = await time.latestBlock();
      this.request = {
        from: this.sender,
        to: constants.ZERO_ADDRESS,
        value: '0',
        gas: '100000',
        nonce: Number(await this.forwarder.nonces(this.sender)),
        data: '0x',
        deadline: this.blockNumber.toNumber() + 2, // Next + 1
      };
      this.forgeData = request => ({
        types: this.types,
        domain: this.domain,
        primaryType: 'ForwardRequest',
        message: { ...this.request, ...request },
      });
      this.sign = request =>
        ethSigUtil.signTypedMessage(this.wallet.getPrivateKey(), {
          data: this.forgeData(request),
        });
    });

    context('verify', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
            web3.utils.toBN(this.request.nonce),
          );
        });

        it('success', async function () {
          expect(await this.forwarder.verify(this.request, this.sign())).to.be.equal(true);
        });

        afterEach(async function () {
          expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
            web3.utils.toBN(this.request.nonce),
          );
        });
      });

      context('with tampered values', function () {
        for (const [key, value] of Object.entries(tamperedValues)) {
          it(`returns false with tampered ${key}`, async function () {
            expect(await this.forwarder.verify(this.forgeData({ [key]: value }).message, this.sign())).to.be.equal(
              false,
            );
          });
        }

        it('returns false with tampered signature', async function () {
          const tamperedsign = web3.utils.hexToBytes(this.sign());
          tamperedsign[42] ^= 0xff;
          expect(await this.forwarder.verify(this.request, web3.utils.bytesToHex(tamperedsign))).to.be.equal(false);
        });

        it('returns false with valid signature for non-current nonce', async function () {
          const req = {
            ...this.request,
            nonce: this.request.nonce + 1,
          };
          const sig = this.sign(req);
          expect(await this.forwarder.verify(req, sig)).to.be.equal(false);
        });

        it('returns false with valid signature for expired deadline', async function () {
          const req = {
            ...this.request,
            nonce: this.request.nonce + 1,
          };
          const sig = this.sign(req);
          expect(await this.forwarder.verify(req, sig)).to.be.equal(false);
        });
      });
    });

    context('execute', function () {
      context('valid signature', function () {
        beforeEach(async function () {
          expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
            web3.utils.toBN(this.request.nonce),
          );
        });

        it('success', async function () {
          await this.forwarder.execute(this.request, this.sign()); // expect to not revert
        });

        afterEach(async function () {
          expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
            web3.utils.toBN(this.request.nonce + 1),
          );
        });
      });

      context('with tampered values', function () {
        for (const [key, value] of Object.entries(tamperedValues)) {
          it(`reverts with tampered ${key}`, async function () {
            const sig = this.sign();
            const data = this.forgeData({ [key]: value });
            await expectRevertCustomError(this.forwarder.execute(data.message, sig), 'MinimalForwarderInvalidSigner', [
              ethSigUtil.recoverTypedSignature({ data, sig }),
              data.message.from,
            ]);
          });
        }

        it('reverts with tampered signature', async function () {
          const tamperedSig = web3.utils.hexToBytes(this.sign());
          tamperedSig[42] ^= 0xff;
          await expectRevertCustomError(
            this.forwarder.execute(this.request, web3.utils.bytesToHex(tamperedSig)),
            'MinimalForwarderInvalidSigner',
            [ethSigUtil.recoverTypedSignature({ data: this.forgeData(), sig: tamperedSig }), this.request.from],
          );
        });

        it('reverts with valid signature for non-current nonce', async function () {
          const req = {
            ...this.request,
            nonce: this.request.nonce + 1,
          };
          const sig = this.sign(req);
          await expectRevertCustomError(this.forwarder.execute(req, sig), 'InvalidAccountNonce', [
            this.request.from,
            this.request.nonce,
          ]);
        });

        it('reverts with valid signature for expired deadline', async function () {
          const req = {
            ...this.request,
            deadline: this.blockNumber.toNumber() - 1,
          };
          const sig = this.sign(req);
          await expectRevertCustomError(this.forwarder.execute(req, sig), 'MinimalForwarderExpiredRequest', [
            this.blockNumber.toNumber() - 1,
          ]);
        });

        it('reverts with valid signature but mismatched value', async function () {
          const value = 100;
          const req = {
            ...this.request,
            value,
          };
          const sig = this.sign(req);
          await expectRevertCustomError(this.forwarder.execute(req, sig), 'MinimalForwarderMismatchedValue', [0, value]);
        });
      });

      it('bubble out of gas', async function () {
        const receiver = await CallReceiverMock.new();
        const gasAvailable = 100000;
        this.request.to = receiver.address;
        this.request.data = receiver.contract.methods.mockFunctionOutOfGas().encodeABI();
        this.request.gas = 1000000;

        await expectRevert.assertion(this.forwarder.execute(this.request, this.sign(), { gas: gasAvailable }));

        const { transactions } = await web3.eth.getBlock('latest');
        const { gasUsed } = await web3.eth.getTransactionReceipt(transactions[0]);

        expect(gasUsed).to.be.equal(gasAvailable);
      });
    });
  });
});
