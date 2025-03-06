const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, ForwardRequest } = require('../helpers/eip712');
const { sum } = require('../helpers/math');
const time = require('../helpers/time');

async function fixture() {
  const [sender, refundReceiver, another, ...accounts] = await ethers.getSigners();

  const forwarder = await ethers.deployContract('ERC2771Forwarder', ['ERC2771Forwarder']);
  const receiver = await ethers.deployContract('CallReceiverMockTrustingForwarder', [forwarder]);
  const domain = await getDomain(forwarder);
  const types = { ForwardRequest };

  const forgeRequest = async (override = {}, signer = sender) => {
    const req = {
      from: await signer.getAddress(),
      to: await receiver.getAddress(),
      value: 0n,
      data: receiver.interface.encodeFunctionData('mockFunction'),
      gas: 100000n,
      deadline: (await time.clock.timestamp()) + 60n,
      nonce: await forwarder.nonces(sender),
      ...override,
    };
    req.signature = await signer.signTypedData(domain, types, req);
    return req;
  };

  const estimateRequest = request =>
    ethers.provider.estimateGas({
      from: forwarder,
      to: request.to,
      data: ethers.solidityPacked(['bytes', 'address'], [request.data, request.from]),
      value: request.value,
      gasLimit: request.gas,
    });

  return {
    sender,
    refundReceiver,
    another,
    accounts,
    forwarder,
    receiver,
    forgeRequest,
    estimateRequest,
    domain,
    types,
  };
}

describe('ERC2771Forwarder', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('verify', function () {
    describe('with valid signature', function () {
      it('returns true without altering the nonce', async function () {
        const request = await this.forgeRequest();
        expect(await this.forwarder.nonces(request.from)).to.equal(request.nonce);
        expect(await this.forwarder.verify(request)).to.be.true;
        expect(await this.forwarder.nonces(request.from)).to.equal(request.nonce);
      });
    });

    describe('with tampered values', function () {
      it('returns false with valid signature for non-current nonce', async function () {
        const request = await this.forgeRequest({ nonce: 1337n });
        expect(await this.forwarder.verify(request)).to.be.false;
      });

      it('returns false with valid signature for expired deadline', async function () {
        const request = await this.forgeRequest({ deadline: (await time.clock.timestamp()) - 1n });
        expect(await this.forwarder.verify(request)).to.be.false;
      });
    });
  });

  describe('execute', function () {
    describe('with valid requests', function () {
      it('emits an event and consumes nonce for a successful request', async function () {
        const request = await this.forgeRequest();

        expect(await this.forwarder.nonces(request.from)).to.equal(request.nonce);

        await expect(this.forwarder.execute(request))
          .to.emit(this.receiver, 'MockFunctionCalled')
          .to.emit(this.forwarder, 'ExecutedForwardRequest')
          .withArgs(request.from, request.nonce, true);

        expect(await this.forwarder.nonces(request.from)).to.equal(request.nonce + 1n);
      });

      it('reverts with an unsuccessful request', async function () {
        const request = await this.forgeRequest({
          data: this.receiver.interface.encodeFunctionData('mockFunctionRevertsNoReason'),
        });

        await expect(this.forwarder.execute(request)).to.be.revertedWithCustomError(this.forwarder, 'FailedCall');
      });
    });

    describe('with tampered request', function () {
      it('reverts with valid signature for non-current nonce', async function () {
        const request = await this.forgeRequest();

        // consume nonce
        await this.forwarder.execute(request);

        // nonce has changed
        await expect(this.forwarder.execute(request))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
          .withArgs(
            ethers.verifyTypedData(
              this.domain,
              this.types,
              { ...request, nonce: request.nonce + 1n },
              request.signature,
            ),
            request.from,
          );
      });

      it('reverts with valid signature for expired deadline', async function () {
        const request = await this.forgeRequest({ deadline: (await time.clock.timestamp()) - 1n });

        await expect(this.forwarder.execute(request))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderExpiredRequest')
          .withArgs(request.deadline);
      });

      it('reverts with valid signature but mismatched value', async function () {
        const request = await this.forgeRequest({ value: 100n });

        await expect(this.forwarder.execute(request))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderMismatchedValue')
          .withArgs(request.value, 0n);
      });
    });

    it('bubbles out of gas', async function () {
      const request = await this.forgeRequest({
        data: this.receiver.interface.encodeFunctionData('mockFunctionOutOfGas'),
        gas: 1_000_000n,
      });

      const gasLimit = 100_000n;
      await expect(this.forwarder.execute(request, { gasLimit })).to.be.revertedWithoutReason();

      const { gasUsed } = await ethers.provider
        .getBlock('latest')
        .then(block => block.getTransaction(0))
        .then(tx => ethers.provider.getTransactionReceipt(tx.hash));

      expect(gasUsed).to.equal(gasLimit);
    });

    it('bubbles out of gas forced by the relayer', async function () {
      const request = await this.forgeRequest();

      // If there's an incentive behind executing requests, a malicious relayer could grief
      // the forwarder by executing requests and providing a top-level call gas limit that
      // is too low to successfully finish the request after the 63/64 rule.

      // We set the baseline to the gas limit consumed by a successful request if it was executed
      // normally. Note this includes the 21000 buffer that also the relayer will be charged to
      // start a request execution.
      const estimate = await this.estimateRequest(request);

      // Because the relayer call consumes gas until the `CALL` opcode, the gas left after failing
      // the subcall won't enough to finish the top level call (after testing), so we add a
      // moderated buffer.
      const gasLimit = estimate + 2_000n;

      // The subcall out of gas should be caught by the contract and then bubbled up consuming
      // the available gas with an `invalid` opcode.
      await expect(this.forwarder.execute(request, { gasLimit })).to.be.revertedWithoutReason();

      const { gasUsed } = await ethers.provider
        .getBlock('latest')
        .then(block => block.getTransaction(0))
        .then(tx => ethers.provider.getTransactionReceipt(tx.hash));

      // We assert that indeed the gas was totally consumed.
      expect(gasUsed).to.equal(gasLimit);
    });
  });

  describe('executeBatch', function () {
    const requestsValue = requests => sum(...requests.map(request => request.value));
    const requestCount = 3;
    const idx = 1; // index that will be tampered with

    beforeEach(async function () {
      this.forgeRequests = override =>
        Promise.all(this.accounts.slice(0, requestCount).map(signer => this.forgeRequest(override, signer)));
      this.requests = await this.forgeRequests({ value: 10n });
      this.value = requestsValue(this.requests);
    });

    describe('with valid requests', function () {
      it('sanity', async function () {
        for (const request of this.requests) {
          expect(await this.forwarder.verify(request)).to.be.true;
        }
      });

      it('emits events', async function () {
        const receipt = this.forwarder.executeBatch(this.requests, this.another, { value: this.value });

        for (const request of this.requests) {
          await expect(receipt)
            .to.emit(this.receiver, 'MockFunctionCalled')
            .to.emit(this.forwarder, 'ExecutedForwardRequest')
            .withArgs(request.from, request.nonce, true);
        }
      });

      it('increase nonces', async function () {
        await this.forwarder.executeBatch(this.requests, this.another, { value: this.value });

        for (const request of this.requests) {
          expect(await this.forwarder.nonces(request.from)).to.equal(request.nonce + 1n);
        }
      });
    });

    describe('with tampered requests', function () {
      it('reverts with mismatched value', async function () {
        // tamper value of one of the request + resign
        this.requests[idx] = await this.forgeRequest({ value: 100n }, this.accounts[1]);

        await expect(this.forwarder.executeBatch(this.requests, this.another, { value: this.value }))
          .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderMismatchedValue')
          .withArgs(requestsValue(this.requests), this.value);
      });

      describe('when the refund receiver is the zero address', function () {
        beforeEach(function () {
          this.refundReceiver = ethers.ZeroAddress;
        });

        it('reverts with at least one valid signature for non-current nonce', async function () {
          // Execute first a request
          await this.forwarder.execute(this.requests[idx], { value: this.requests[idx].value });

          // And then fail due to an already used nonce
          await expect(this.forwarder.executeBatch(this.requests, this.refundReceiver, { value: this.value }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderInvalidSigner')
            .withArgs(
              ethers.verifyTypedData(
                this.domain,
                this.types,
                { ...this.requests[idx], nonce: this.requests[idx].nonce + 1n },
                this.requests[idx].signature,
              ),
              this.requests[idx].from,
            );
        });

        it('reverts with at least one valid signature for expired deadline', async function () {
          this.requests[idx] = await this.forgeRequest(
            { ...this.requests[idx], deadline: (await time.clock.timestamp()) - 1n },
            this.accounts[1],
          );

          await expect(this.forwarder.executeBatch(this.requests, this.refundReceiver, { value: this.amount }))
            .to.be.revertedWithCustomError(this.forwarder, 'ERC2771ForwarderExpiredRequest')
            .withArgs(this.requests[idx].deadline);
        });
      });

      describe('when the refund receiver is a known address', function () {
        beforeEach(async function () {
          this.initialRefundReceiverBalance = await ethers.provider.getBalance(this.refundReceiver);
          this.initialTamperedRequestNonce = await this.forwarder.nonces(this.requests[idx].from);
        });

        it('ignores a request with a valid signature for non-current nonce', async function () {
          // Execute first a request
          await this.forwarder.execute(this.requests[idx], { value: this.requests[idx].value });
          this.initialTamperedRequestNonce++; // Should be already incremented by the individual `execute`

          // And then ignore the same request in a batch due to an already used nonce
          const events = await this.forwarder
            .executeBatch(this.requests, this.refundReceiver, { value: this.value })
            .then(tx => tx.wait())
            .then(receipt =>
              receipt.logs.filter(
                log => log?.fragment?.type == 'event' && log?.fragment?.name == 'ExecutedForwardRequest',
              ),
            );

          expect(events).to.have.lengthOf(this.requests.length - 1);
        });

        it('ignores a request with a valid signature for expired deadline', async function () {
          this.requests[idx] = await this.forgeRequest(
            { ...this.requests[idx], deadline: (await time.clock.timestamp()) - 1n },
            this.accounts[1],
          );

          const events = await this.forwarder
            .executeBatch(this.requests, this.refundReceiver, { value: this.value })
            .then(tx => tx.wait())
            .then(receipt =>
              receipt.logs.filter(
                log => log?.fragment?.type == 'event' && log?.fragment?.name == 'ExecutedForwardRequest',
              ),
            );

          expect(events).to.have.lengthOf(this.requests.length - 1);
        });

        afterEach(async function () {
          // The invalid request value was refunded
          expect(await ethers.provider.getBalance(this.refundReceiver)).to.equal(
            this.initialRefundReceiverBalance + this.requests[idx].value,
          );

          // The invalid request from's nonce was not incremented
          expect(await this.forwarder.nonces(this.requests[idx].from)).to.equal(this.initialTamperedRequestNonce);
        });
      });

      it('bubbles out of gas', async function () {
        this.requests[idx] = await this.forgeRequest({
          data: this.receiver.interface.encodeFunctionData('mockFunctionOutOfGas'),
          gas: 1_000_000n,
        });

        const gasLimit = 300_000n;
        await expect(
          this.forwarder.executeBatch(this.requests, ethers.ZeroAddress, {
            gasLimit,
            value: requestsValue(this.requests),
          }),
        ).to.be.revertedWithoutReason();

        const { gasUsed } = await ethers.provider
          .getBlock('latest')
          .then(block => block.getTransaction(0))
          .then(tx => ethers.provider.getTransactionReceipt(tx.hash));

        expect(gasUsed).to.equal(gasLimit);
      });

      it('bubbles out of gas forced by the relayer', async function () {
        // Similarly to the single execute, a malicious relayer could grief requests.

        // We estimate until the selected request as if they were executed normally
        const estimate = await Promise.all(this.requests.slice(0, idx + 1).map(this.estimateRequest)).then(gas =>
          sum(...gas),
        );

        // We add a Buffer to account for all the gas that's used before the selected call.
        // Note is slightly bigger because the selected request is not the index 0 and it affects
        // the buffer needed.
        const gasLimit = estimate + 10_000n;

        // The subcall out of gas should be caught by the contract and then bubbled up consuming
        // the available gas with an `invalid` opcode.
        await expect(
          this.forwarder.executeBatch(this.requests, ethers.ZeroAddress, {
            gasLimit,
            value: requestsValue(this.requests),
          }),
        ).to.be.revertedWithoutReason();

        const { gasUsed } = await ethers.provider
          .getBlock('latest')
          .then(block => block.getTransaction(0))
          .then(tx => ethers.provider.getTransactionReceipt(tx.hash));

        // We assert that indeed the gas was totally consumed.
        expect(gasUsed).to.equal(gasLimit);
      });
    });
  });
});
