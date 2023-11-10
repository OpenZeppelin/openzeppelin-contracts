const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { getDomain } = require('../helpers/eip712');
const { bigint: time } = require('../helpers/time');

async function fixture() {
  const [alice, bob, eve, refundReceiver, other] = await ethers.getSigners();

  const forwarder = await ethers.deployContract('ERC2771Forwarder', []);
  const receiver = await ethers.deployContract('CallReceiverMockTrustingForwarder', [forwarder.target]);
  const domain = await getDomain(forwarder);
  const timestamp = await time.clock.timestamp();

  return { alice, bob, eve, refundReceiver, other, forwarder, receiver, domain, timestamp };
}

describe('ERC2771Forwarder', function () {
  const tamperedValues = {
    from: ethers.Wallet.createRandom().address,
    value: ethers.parseEther('0.5'),
    data: '0x1742',
  };

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

    this.request = {
      from: this.alice.address,
      to: this.receiver.target,
      value: '0',
      gas: '100000',
      data: this.receiver.interface.encodeFunctionData(this.receiver.mockFunction.fragment, []),
      deadline: this.timestamp + time.duration.minutes(1),
    };

    this.requestData = {
      ...this.request,
      nonce: await this.forwarder.nonces(this.alice),
    };

    this.forgeRequestData = request => ({ ...this.requestData, ...request });
    this.sign = (signer, request) => signer.signTypedData(this.domain, this.types, this.forgeRequestData(request));
    this.recover = (request, signature) =>
      ethers.verifyTypedData(this.domain, this.types, this.forgeRequestData(request), signature);
    this.requestData.signature = await this.sign(this.alice);

    this.estimateRequest = request =>
      ethers.provider.estimateGas({
        from: this.forwarder.address,
        to: request.to,
        data: ethers.solidityPacked(['bytes', 'address'], [request.data, request.from]),
        value: request.value,
        gasLimit: request.gas,
      });
  });

  context('verify', function () {
    context('with valid signature', function () {
      it('returns true without altering the nonce', async function () {
        expect(await this.forwarder.nonces(this.requestData.from)).to.equal(this.requestData.nonce);
        expect(await this.forwarder.verify(this.requestData)).to.equal(true);
        expect(await this.forwarder.nonces(this.requestData.from)).to.equal(this.requestData.nonce);
      });
    });

    context('with tampered values', function () {
      for (const [key, value] of Object.entries(tamperedValues)) {
        it(`returns false with tampered ${key}`, async function () {
          expect(await this.forwarder.verify(this.forgeRequestData({ [key]: value }))).to.equal(false);
        });
      }

      it('returns false with an untrustful to', async function () {
        expect(await this.forwarder.verify(this.forgeRequestData({ to: this.other.address }))).to.equal(false);
      });

      it('returns false with tampered signature', async function () {
        this.requestData.signature = ethers.toBeArray(BigInt(this.requestData.signature));
        this.requestData.signature[42] ^= 0xff;
        this.requestData.signature = ethers.toBeHex(ethers.toBigInt(this.requestData.signature));
        expect(await this.forwarder.verify(this.requestData)).to.equal(false);
      });

      it('returns false with valid signature for non-current nonce', async function () {
        const req = {
          ...this.requestData,
          nonce: this.requestData.nonce + 1n,
        };
        req.signature = this.sign(this.alice, req);
        expect(await this.forwarder.verify(req)).to.equal(false);
      });

      it('returns false with valid signature for expired deadline', async function () {
        const req = {
          ...this.requestData,
          deadline: this.timestamp - 1n,
        };
        req.signature = this.sign(this.alice, req);
        expect(await this.forwarder.verify(req)).to.equal(false);
      });
    });
  });

  context('execute', function () {
    context('with valid requests', function () {
      beforeEach(async function () {
        expect(await this.forwarder.nonces(this.requestData.from)).to.equal(this.requestData.nonce);
      });

      it('emits an event and consumes nonce for a successful request', async function () {
        const tx = await this.forwarder.execute(this.requestData);
        await expect(tx).to.emit(this.receiver, 'MockFunctionCalled');
        await expect(tx)
          .to.emit(this.forwarder, 'ExecutedForwardRequest')
          .withArgs(this.requestData.from, this.requestData.nonce, true);
        expect(await this.forwarder.nonces(this.requestData.from)).to.equal(this.requestData.nonce + 1n);
      });

      it('reverts with an unsuccessful request', async function () {
        const req = {
          ...this.requestData,
          data: this.receiver.interface.encodeFunctionData(this.receiver.mockFunctionRevertsNoReason.fragment, []),
        };
        req.signature = this.sign(this.alice, req);
        await expect(this.forwarder.execute(req)).to.be.revertedWithCustomError(this.forwarder, 'FailedInnerCall');
      });
    });

    context('with tampered request', function () {
      for (const [key, value] of Object.entries(tamperedValues)) {
        it(`reverts with tampered ${key}`, async function () {
          const data = this.forgeRequestData({ [key]: value });
          const expectedSigner = await this.recover(data, this.requestData.signature);
          await expect(
            this.forwarder.execute(data, {
              value: key == 'value' ? value : 0, // To avoid MismatchedValue error
            }),
          )
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
            .withArgs(expectedSigner, data.from);
        });
      }

      it('reverts with an untrustful to', async function () {
        const data = this.forgeRequestData({ to: this.other.address });
        await expect(this.forwarder.execute(data))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771UntrustfulTarget')
          .withArgs(data.to, this.forwarder.target);
      });

      it('reverts with tampered signature', async function () {
        this.requestData.signature = ethers.toBeArray(BigInt(this.requestData.signature));
        this.requestData.signature[42] ^= 0xff;
        this.requestData.signature = ethers.toBeHex(ethers.toBigInt(this.requestData.signature));
        expect(await this.forwarder.verify(this.requestData)).to.equal(false);
        const expectedSigner = await this.recover(this.requestData, this.requestData.signature);
        await expect(this.forwarder.execute(this.requestData))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
          .withArgs(expectedSigner, this.requestData.from);
      });

      it('reverts with valid signature for non-current nonce', async function () {
        // Execute first a request
        await this.forwarder.execute(this.requestData);

        // And then fail due to an already used nonce
        const expectedSigner = await this.recover(
          { ...this.requestData, nonce: this.requestData.nonce + 1n },
          this.requestData.signature,
        );
        await expect(this.forwarder.execute(this.requestData))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
          .withArgs(expectedSigner, this.requestData.from);
      });

      it('reverts with valid signature for expired deadline', async function () {
        const req = {
          ...this.requestData,
          deadline: this.timestamp - 1n,
        };
        req.signature = this.sign(this.alice, req);
        await expect(this.forwarder.execute(req))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderExpiredRequest')
          .withArgs(this.timestamp - 1n);
      });

      it('reverts with valid signature but mismatched value', async function () {
        const value = 100;
        const req = {
          ...this.requestData,
          value,
        };
        req.signature = this.sign(this.alice, req);
        await expect(this.forwarder.execute(req))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderMismatchedValue')
          .withArgs(value, 0);
      });
    });

    it('bubbles out of gas', async function () {
      this.requestData.data = this.receiver.interface.encodeFunctionData(
        this.receiver.mockFunctionOutOfGas.fragment,
        [],
      );
      this.requestData.gas = 1_000_000;
      this.requestData.signature = this.sign(this.alice);

      const gasAvailable = 100_000;
      await expect(this.forwarder.execute(this.requestData, { gasLimit: gasAvailable })).to.be.revertedWithoutReason();

      const block = await ethers.provider.getBlock('latest');
      const { gasUsed } = await ethers.provider.getTransactionReceipt(block.transactions[0]);

      expect(gasUsed).to.equal(gasAvailable);
    });

    it('bubbles out of gas forced by the relayer', async function () {
      // If there's an incentive behind executing requests, a malicious relayer could grief
      // the forwarder by executing requests and providing a top-level call gas limit that
      // is too low to successfully finish the request after the 63/64 rule.

      // We set the baseline to the gas limit consumed by a successful request if it was executed
      // normally. Note this includes the 21000 buffer that also the relayer will be charged to
      // start a request execution.
      const estimate = await this.estimateRequest(this.request);

      // Because the relayer call consumes gas until the `CALL` opcode, the gas left after failing
      // the subcall won't enough to finish the top level call (after testing), so we add a
      // moderated buffer.
      const gasAvailable = estimate + 2_000n;

      // The subcall out of gas should be caught by the contract and then bubbled up consuming
      // the available gas with an `invalid` opcode.
      await expect(this.forwarder.execute(this.requestData, { gasLimit: gasAvailable })).to.be.revertedWithoutReason();

      const block = await ethers.provider.getBlock('latest');
      const { gasUsed } = await ethers.provider.getTransactionReceipt(block.transactions[0]);

      // We assert that indeed the gas was totally consumed.
      expect(gasUsed).to.equal(gasAvailable);
    });
  });

  context('executeBatch', function () {
    const batchValue = requestDatas => requestDatas.reduce((value, request) => value + request.value, 0n);

    beforeEach(async function () {
      this.signers = [this.alice, this.bob, this.eve];

      this.requestDatas = await Promise.all(
        this.signers.map(async ({ address }) => ({
          ...this.requestData,
          from: address,
          nonce: await this.forwarder.nonces(address),
          value: ethers.parseUnits('10', 'gwei'),
        })),
      );

      this.requestDatas = await Promise.all(
        this.requestDatas.map(async (requestData, i) => ({
          ...requestData,
          signature: await this.sign(this.signers[i], requestData),
        })),
      );

      this.msgValue = batchValue(this.requestDatas);

      this.gasUntil = async reqIdx => {
        const gas = 0n;
        const estimations = await Promise.all(
          new Array(reqIdx + 1n).fill().map((_, idx) => this.estimateRequest(this.requestDatas[idx])),
        );
        return estimations.reduce((acc, estimation) => acc + estimation, gas);
      };
    });

    context('with valid requests', function () {
      beforeEach(async function () {
        for (const request of this.requestDatas) {
          expect(await this.forwarder.verify(request)).to.equal(true);
        }

        this.receipt = await this.forwarder.executeBatch(this.requestDatas, this.other, { value: this.msgValue });
      });

      it('emits events', function () {
        for (const request of this.requestDatas) {
          expect(this.receipt).to.emit(this.receiver, 'MockFunctionCalled');
          expect(this.receipt)
            .to.emit(this.forwarder, 'ExecutedForwardRequest')
            .withArgs(request.from, request.nonce, true);
        }
      });

      it('increase nonces', async function () {
        for (const request of this.requestDatas) {
          expect(await this.forwarder.nonces(request.from)).to.eq(request.nonce + 1n);
        }
      });
    });

    context('with tampered requests', function () {
      beforeEach(function () {
        this.idx = 1; // Tampered idx
      });

      it('reverts with mismatched value', async function () {
        this.requestDatas[this.idx].value = 100n;
        this.requestDatas[this.idx].signature = this.sign(this.signers[this.idx], this.requestDatas[this.idx]);
        await expect(this.forwarder.executeBatch(this.requestDatas, this.other, { value: this.msgValue }))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderMismatchedValue')
          .withArgs(batchValue(this.requestDatas), this.msgValue);
      });

      context('when the refund receiver is the zero address', function () {
        beforeEach(function () {
          this.refundReceiver = ethers.ZeroAddress;
        });

        for (const [key, value] of Object.entries(tamperedValues)) {
          it(`reverts with at least one tampered request ${key}`, async function () {
            const data = this.forgeRequestData({ ...this.requestDatas[this.idx], [key]: value });

            const signature = this.requestDatas[this.idx].signature;
            this.requestDatas[this.idx] = data;

            const expectedSigner = await this.recover(data, signature);
            await expect(this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, { value: this.msgValue }))
              .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
              .withArgs(expectedSigner, data.from);
          });
        }

        it('reverts with at least one untrustful to', async function () {
          const data = this.forgeRequestData({ ...this.requestDatas[this.idx], to: this.other.address });

          this.requestDatas[this.idx] = data;

          await expect(this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, { value: this.msgValue }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771UntrustfulTarget')
            .withArgs(this.requestDatas[this.idx].to, this.forwarder.target);
        });

        it('reverts with at least one tampered request signature', async function () {
          this.requestDatas[this.idx].signature = ethers.toBeArray(BigInt(this.requestDatas[this.idx].signature));
          this.requestDatas[this.idx].signature[42] ^= 0xff;
          this.requestDatas[this.idx].signature = ethers.toBeHex(
            ethers.toBigInt(this.requestDatas[this.idx].signature),
          );

          const expectedSigner = await this.recover(this.requestDatas[this.idx], this.requestDatas[this.idx].signature);
          await expect(this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, { value: this.msgValue }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
            .withArgs(expectedSigner, this.requestDatas[this.idx].from);
        });

        it('reverts with at least one valid signature for non-current nonce', async function () {
          // Execute first a request
          await this.forwarder.execute(this.requestDatas[this.idx], { value: this.requestDatas[this.idx].value });

          // And then fail due to an already used nonce
          const data = {
            ...this.requestDatas[this.idx],
            nonce: this.requestDatas[this.idx].nonce + 1n,
          };
          const expectedSigner = await this.recover(data, this.requestDatas[this.idx].signature);
          await expect(this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, { value: this.msgValue }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
            .withArgs(expectedSigner, this.requestDatas[this.idx].from);
        });

        it('reverts with at least one valid signature for expired deadline', async function () {
          this.requestDatas[this.idx].deadline = this.timestamp - 1n;
          this.requestDatas[this.idx].signature = this.sign(this.signers[this.idx], this.requestDatas[this.idx]);
          await expect(this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, { value: this.msgValue }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderExpiredRequest')
            .withArgs(this.timestamp - 1n);
        });
      });

      context('when the refund receiver is a known address', function () {
        beforeEach(async function () {
          this.initialRefundReceiverBalance = await ethers.provider.getBalance(this.refundReceiver);
          this.initialTamperedRequestNonce = await this.forwarder.nonces(this.requestDatas[this.idx].from);
        });

        for (const [key, value] of Object.entries(tamperedValues)) {
          it(`ignores a request with tampered ${key} and refunds its value`, async function () {
            const data = this.forgeRequestData({ ...this.requestDatas[this.idx], [key]: value });

            this.requestDatas[this.idx] = data;

            const tx = await this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, {
              value: batchValue(this.requestDatas),
            });
            const { logs } = await ethers.provider.getTransactionReceipt(tx.hash);
            const executedEvents = logs.filter(
              log => this.forwarder.interface.parseLog(log)?.name === 'ExecutedForwardRequest',
            );
            expect(executedEvents.length).to.equal(2);
          });
        }

        it('ignores a request with a valid signature for non-current nonce', async function () {
          // Execute first a request
          await this.forwarder.execute(this.requestDatas[this.idx], { value: this.requestDatas[this.idx].value });
          this.initialTamperedRequestNonce++; // Should be already incremented by the individual `execute`

          // And then ignore the same request in a batch due to an already used nonce
          const tx = await this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, {
            value: this.msgValue,
          });
          const { logs } = await ethers.provider.getTransactionReceipt(tx.hash);
          const executedEvents = logs.filter(
            log => this.forwarder.interface.parseLog(log)?.name === 'ExecutedForwardRequest',
          );
          expect(executedEvents.length).to.equal(2);
        });

        it('ignores a request with a valid signature for expired deadline', async function () {
          this.requestDatas[this.idx].deadline = this.timestamp - 1n;
          this.requestDatas[this.idx].signature = this.sign(this.signers[this.idx], this.requestDatas[this.idx]);

          const tx = await this.forwarder.executeBatch(this.requestDatas, this.refundReceiver, {
            value: this.msgValue,
          });
          const { logs } = await ethers.provider.getTransactionReceipt(tx.hash);
          const executedEvents = logs.filter(
            log => this.forwarder.interface.parseLog(log)?.name === 'ExecutedForwardRequest',
          );
          expect(executedEvents.length).to.equal(2);
        });

        afterEach(async function () {
          // The invalid request value was refunded
          expect(await ethers.provider.getBalance(this.refundReceiver)).to.equal(
            this.initialRefundReceiverBalance + this.requestDatas[this.idx].value,
          );

          // The invalid request from's nonce was not incremented
          expect(await this.forwarder.nonces(this.requestDatas[this.idx].from)).to.eq(this.initialTamperedRequestNonce);
        });
      });

      it('bubbles out of gas', async function () {
        this.requestDatas[this.idx].data = this.receiver.interface.encodeFunctionData(
          this.receiver.mockFunctionOutOfGas.fragment,
          [],
        );
        this.requestDatas[this.idx].gas = 1_000_000;
        this.requestDatas[this.idx].signature = this.sign(this.signers[this.idx], this.requestDatas[this.idx]);

        const gasAvailable = 300_000;
        await expect(
          this.forwarder.executeBatch(this.requestDatas, ethers.ZeroAddress, {
            gasLimit: gasAvailable,
            value: this.requestDatas.reduce((acc, { value }) => acc + value, 0n),
          }),
        ).to.be.revertedWithoutReason();

        const block = await ethers.provider.getBlock('latest');
        const { gasUsed } = await ethers.provider.getTransactionReceipt(block.transactions[0]);

        expect(gasUsed).to.equal(gasAvailable);
      });

      it('bubbles out of gas forced by the relayer', async function () {
        // Similarly to the single execute, a malicious relayer could grief requests.

        // We estimate until the selected request as if they were executed normally
        const estimate = await this.gasUntil(this.requestDatas, this.idx);

        // We add a Buffer to account for all the gas that's used before the selected call.
        // Note is slightly bigger because the selected request is not the index 0 and it affects
        // the buffer needed.
        const gasAvailable = estimate + 10_000n;

        // The subcall out of gas should be caught by the contract and then bubbled up consuming
        // the available gas with an `invalid` opcode.
        await expect(
          this.forwarder.executeBatch(this.requestDatas, ethers.ZeroAddress, { gasLimit: gasAvailable }),
        ).to.be.revertedWithoutReason();

        const block = await ethers.provider.getBlock('latest');
        const { gasUsed } = await ethers.provider.getTransactionReceipt(block.transactions[0]);

        // We assert that indeed the gas was totally consumed.
        expect(gasUsed).to.equal(gasAvailable);
      });
    });
  });
});
