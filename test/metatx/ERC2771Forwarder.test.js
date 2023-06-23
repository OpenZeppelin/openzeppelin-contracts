const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { getDomain, domainType } = require('../helpers/eip712');
const { expectRevertCustomError } = require('../helpers/customError');

const { constants, expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC2771Forwarder = artifacts.require('ERC2771Forwarder');
const CallReceiverMock = artifacts.require('CallReceiverMock');

contract('ERC2771Forwarder', function (accounts) {
  const tamperedValues = {
    from: accounts[0],
    to: accounts[0],
    value: web3.utils.toWei('1'),
    nonce: 1234,
    data: '0x1742',
    deadline: 0xabcdef,
  };

  beforeEach(async function () {
    this.forwarder = await ERC2771Forwarder.new('ERC2771Forwarder');

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

    this.alice = Wallet.generate();
    this.alice.address = web3.utils.toChecksumAddress(this.alice.getAddressString());

    this.blockNumber = await time.latestBlock();
    this.request = {
      from: this.alice.address,
      to: constants.ZERO_ADDRESS,
      value: '0',
      gas: '100000',
      nonce: (await this.forwarder.nonces(this.alice.address)).toString(),
      data: '0x',
      deadline: this.blockNumber.toNumber() + 2, // Next + 1
    };

    this.forgeData = request => ({
      types: this.types,
      domain: this.domain,
      primaryType: 'ForwardRequest',
      message: { ...this.request, ...request },
    });
    this.sign = (privateKey, request) =>
      ethSigUtil.signTypedMessage(privateKey, {
        data: this.forgeData(request),
      });

    this.signature = this.sign(this.alice.getPrivateKey());
  });

  context('verify', function () {
    context('with valid signature', function () {
      beforeEach(async function () {
        expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
          web3.utils.toBN(this.request.nonce),
        );
      });

      it('success', async function () {
        expect(await this.forwarder.verify(this.request, this.signature)).to.be.equal(true);
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
          expect(await this.forwarder.verify(this.forgeData({ [key]: value }).message, this.signature)).to.be.equal(
            false,
          );
        });
      }

      it('returns false with tampered signature', async function () {
        const tamperedsign = web3.utils.hexToBytes(this.signature);
        tamperedsign[42] ^= 0xff;
        expect(await this.forwarder.verify(this.request, web3.utils.bytesToHex(tamperedsign))).to.be.equal(false);
      });

      it('returns false with valid signature for non-current nonce', async function () {
        const req = {
          ...this.request,
          nonce: this.request.nonce + 1,
        };
        const sig = this.sign(this.alice.getPrivateKey(), req);
        expect(await this.forwarder.verify(req, sig)).to.be.equal(false);
      });

      it('returns false with valid signature for expired deadline', async function () {
        const req = {
          ...this.request,
          nonce: this.request.nonce + 1,
        };
        const sig = this.sign(this.alice.getPrivateKey(), req);
        expect(await this.forwarder.verify(req, sig)).to.be.equal(false);
      });
    });
  });

  context('execute', function () {
    context('with valid signature', function () {
      beforeEach(async function () {
        expect(await this.forwarder.nonces(this.request.from)).to.be.bignumber.equal(
          web3.utils.toBN(this.request.nonce),
        );
      });

      it('succeeds', async function () {
        const receipt = await this.forwarder.execute(this.request, this.signature);
        expectEvent(receipt, 'ExecutedForwardRequest', {
          signer: this.request.from,
          nonce: web3.utils.toBN(this.request.nonce),
          success: true,
          returndata: null,
        });
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
          const sig = this.sign(this.alice.getPrivateKey());
          const data = this.forgeData({ [key]: value });
          await expectRevertCustomError(
            this.forwarder.execute(data.message, sig, {
              value: key == 'value' ? value : 0, // To avoid MismatchedValue error
            }),
            'ERC2771ForwarderInvalidSigner',
            [ethSigUtil.recoverTypedSignature({ data, sig }), data.message.from],
          );
        });
      }

      it('reverts with tampered signature', async function () {
        const tamperedSig = web3.utils.hexToBytes(this.signature);
        tamperedSig[42] ^= 0xff;
        await expectRevertCustomError(
          this.forwarder.execute(this.request, web3.utils.bytesToHex(tamperedSig)),
          'ERC2771ForwarderInvalidSigner',
          [ethSigUtil.recoverTypedSignature({ data: this.forgeData(), sig: tamperedSig }), this.request.from],
        );
      });

      it('succeeds without executing the request with valid signature for non-current nonce', async function () {
        const req = {
          ...this.request,
          nonce: this.request.nonce + 1,
        };
        const sig = this.sign(this.alice.getPrivateKey(), req);
        await expectEvent.notEmitted(await this.forwarder.execute(req, sig), 'ExecutedForwardRequest');
      });

      it('reverts with valid signature for expired deadline', async function () {
        const req = {
          ...this.request,
          deadline: this.blockNumber.toNumber() - 1,
        };
        const sig = this.sign(this.alice.getPrivateKey(), req);
        await expectRevertCustomError(this.forwarder.execute(req, sig), 'ERC2771ForwarderExpiredRequest', [
          this.blockNumber.toNumber() - 1,
        ]);
      });

      it('reverts with valid signature but mismatched value', async function () {
        const value = 100;
        const req = {
          ...this.request,
          value,
        };
        const sig = this.sign(this.alice.getPrivateKey(), req);
        await expectRevertCustomError(this.forwarder.execute(req, sig), 'ERC2771ForwarderMismatchedValue', [0, value]);
      });
    });

    it('bubbles out of gas', async function () {
      const receiver = await CallReceiverMock.new();
      const gasAvailable = 100000;
      this.request.to = receiver.address;
      this.request.data = receiver.contract.methods.mockFunctionOutOfGas().encodeABI();
      this.request.gas = 1000000;

      await expectRevert.assertion(
        this.forwarder.execute(this.request, this.sign(this.alice.getPrivateKey()), { gas: gasAvailable }),
      );

      const { transactions } = await web3.eth.getBlock('latest');
      const { gasUsed } = await web3.eth.getTransactionReceipt(transactions[0]);

      expect(gasUsed).to.be.equal(gasAvailable);
    });
  });

  context('executeBatch', function () {
    beforeEach(async function () {
      this.bob = Wallet.generate();
      this.bob.address = web3.utils.toChecksumAddress(this.bob.getAddressString());

      this.eve = Wallet.generate();
      this.eve.address = web3.utils.toChecksumAddress(this.eve.getAddressString());

      this.signers = [this.alice, this.bob, this.eve];

      this.requests = await Promise.all(
        this.signers.map(async ({ address }) => ({
          ...this.request,
          from: address,
          nonce: Number(await this.forwarder.nonces(address)),
        })),
      );

      this.signatures = this.signers.map((signer, i) => this.sign(signer.getPrivateKey(), this.requests[i]));
    });

    it('reverts with mismatched lengths', async function () {
      await expectRevertCustomError(
        this.forwarder.executeBatch(this.requests, this.signatures.slice(0, -1)),
        'ERC2771ForwarderInvalidBatchLength',
        [this.requests.length, this.signatures.length - 1],
      );

      await expectRevertCustomError(
        this.forwarder.executeBatch(this.requests.slice(0, -1), this.signatures),
        'ERC2771ForwarderInvalidBatchLength',
        [this.requests.length - 1, this.signatures.length],
      );
    });

    context('with valid signatures', function () {
      beforeEach(async function () {
        this.receipt = await this.forwarder.executeBatch(this.requests, this.signatures);
      });

      it('emits events', async function () {
        for (const request of this.requests) {
          expectEvent(this.receipt, 'ExecutedForwardRequest', {
            signer: request.from,
            nonce: web3.utils.toBN(request.nonce),
            success: true,
            returndata: null,
          });
        }
      });

      it('increase nonces', async function () {
        for (const request of this.requests) {
          expect(await this.forwarder.nonces(request.from)).to.be.bignumber.eq(web3.utils.toBN(request.nonce + 1));
        }
      });
    });

    context('with tampered values', function () {
      beforeEach(async function () {
        this.idx = 1;
      });

      for (const [key, value] of Object.entries(tamperedValues)) {
        it(`reverts with at least one tampered request ${key}`, async function () {
          const data = this.forgeData({ [key]: value });
          const sig = this.sign(this.signers[this.idx].getPrivateKey());

          this.requests[this.idx] = data.message;
          this.signatures[this.idx] = sig;

          await expectRevertCustomError(
            this.forwarder.executeBatch(this.requests, this.signatures),
            'ERC2771ForwarderInvalidSigner',
            [ethSigUtil.recoverTypedSignature({ data, sig }), data.message.from],
          );
        });
      }

      it('reverts with at least one tampered request signature', async function () {
        const tamperedSig = web3.utils.hexToBytes(this.signatures[this.idx]);
        tamperedSig[42] ^= 0xff;

        this.signatures[this.idx] = web3.utils.bytesToHex(tamperedSig);

        await expectRevertCustomError(
          this.forwarder.executeBatch(this.requests, this.signatures),
          'ERC2771ForwarderInvalidSigner',
          [
            ethSigUtil.recoverTypedSignature({
              data: this.forgeData(this.requests[this.idx]),
              sig: this.signatures[this.idx],
            }),
            this.requests[this.idx].from,
          ],
        );
      });

      it('succeeds with one valid signature for non-current nonce without executing the invalid request', async function () {
        this.requests[this.idx].nonce = this.requests[this.idx].nonce + 1;
        this.signatures[this.idx] = this.sign(this.signers[this.idx].getPrivateKey(), this.requests[this.idx]);

        const receipt = await this.forwarder.executeBatch(this.requests, this.signatures);

        expect(receipt.logs.filter(({ event }) => event === 'ExecutedForwardRequest').length).to.be.equal(2);
      });

      it('reverts with at least one valid signature for expired deadline', async function () {
        this.requests[this.idx].deadline = this.blockNumber.toNumber() - 1;
        this.signatures[this.idx] = this.sign(this.signers[this.idx].getPrivateKey(), this.requests[this.idx]);
        await expectRevertCustomError(
          this.forwarder.executeBatch(this.requests, this.signatures),
          'ERC2771ForwarderExpiredRequest',
          [this.blockNumber.toNumber() - 1],
        );
      });

      it('reverts with at least one valid signature but mismatched value', async function () {
        const value = 100;
        this.requests[this.idx].value = value;
        this.signatures[this.idx] = this.sign(this.signers[this.idx].getPrivateKey(), this.requests[this.idx]);
        await expectRevertCustomError(
          this.forwarder.executeBatch(this.requests, this.signatures),
          'ERC2771ForwarderMismatchedValue',
          [0, value],
        );
      });
    });

    it('bubbles out of gas', async function () {
      const receiver = await CallReceiverMock.new();
      const gasAvailable = 100000;
      const idx = 0;
      this.requests[idx].to = receiver.address;
      this.requests[idx].data = receiver.contract.methods.mockFunctionOutOfGas().encodeABI();
      this.requests[idx].gas = 1000000;

      this.signatures[idx] = this.sign(this.signers[idx].getPrivateKey(), this.requests[idx]);

      await expectRevert.assertion(this.forwarder.executeBatch(this.requests, this.signatures, { gas: gasAvailable }));

      const { transactions } = await web3.eth.getBlock('latest');
      const { gasUsed } = await web3.eth.getTransactionReceipt(transactions[0]);

      expect(gasUsed).to.be.equal(gasAvailable);
    });
  });
});
