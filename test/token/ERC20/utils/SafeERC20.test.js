const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const name = 'ERC20Mock';
const symbol = 'ERC20Mock';
const value = 100n;
const data = '0x12345678';

async function fixture() {
  const [hasNoCode, owner, receiver, spender, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$SafeERC20');
  const erc20ReturnFalseMock = await ethers.deployContract('$ERC20ReturnFalseMock', [name, symbol]);
  const erc20ReturnTrueMock = await ethers.deployContract('$ERC20', [name, symbol]); // default implementation returns true
  const erc20NoReturnMock = await ethers.deployContract('$ERC20NoReturnMock', [name, symbol]);
  const erc20ForceApproveMock = await ethers.deployContract('$ERC20ForceApproveMock', [name, symbol]);
  const erc1363Mock = await ethers.deployContract('$ERC1363', [name, symbol]);
  const erc1363ReturnFalseOnErc20Mock = await ethers.deployContract('$ERC1363ReturnFalseOnERC20Mock', [name, symbol]);
  const erc1363ReturnFalseMock = await ethers.deployContract('$ERC1363ReturnFalseMock', [name, symbol]);
  const erc1363NoReturnMock = await ethers.deployContract('$ERC1363NoReturnMock', [name, symbol]);
  const erc1363ForceApproveMock = await ethers.deployContract('$ERC1363ForceApproveMock', [name, symbol]);
  const erc1363Receiver = await ethers.deployContract('$ERC1363ReceiverMock');
  const erc1363Spender = await ethers.deployContract('$ERC1363SpenderMock');

  return {
    hasNoCode,
    owner,
    receiver,
    spender,
    other,
    mock,
    erc20ReturnFalseMock,
    erc20ReturnTrueMock,
    erc20NoReturnMock,
    erc20ForceApproveMock,
    erc1363Mock,
    erc1363ReturnFalseOnErc20Mock,
    erc1363ReturnFalseMock,
    erc1363NoReturnMock,
    erc1363ForceApproveMock,
    erc1363Receiver,
    erc1363Spender,
  };
}

describe('SafeERC20', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('with address that has no contract code', function () {
    beforeEach(async function () {
      this.token = this.hasNoCode;
    });

    it('reverts on transfer', async function () {
      await expect(this.mock.$safeTransfer(this.token, this.receiver, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('returns false on trySafeTransfer', async function () {
      await expect(this.mock.$trySafeTransfer(this.token, this.receiver, 0n))
        .to.emit(this.mock, 'return$trySafeTransfer')
        .withArgs(false);
    });

    it('reverts on transferFrom', async function () {
      await expect(this.mock.$safeTransferFrom(this.token, this.mock, this.receiver, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('returns false on trySafeTransferFrom', async function () {
      await expect(this.mock.$trySafeTransferFrom(this.token, this.mock, this.receiver, 0n))
        .to.emit(this.mock, 'return$trySafeTransferFrom')
        .withArgs(false);
    });

    it('reverts on increaseAllowance', async function () {
      // Call to 'token.allowance' does not return any data, resulting in a decoding error (revert without reason)
      await expect(this.mock.$safeIncreaseAllowance(this.token, this.spender, 0n)).to.be.revertedWithoutReason();
    });

    it('reverts on decreaseAllowance', async function () {
      // Call to 'token.allowance' does not return any data, resulting in a decoding error (revert without reason)
      await expect(this.mock.$safeDecreaseAllowance(this.token, this.spender, 0n)).to.be.revertedWithoutReason();
    });

    it('reverts on forceApprove', async function () {
      await expect(this.mock.$forceApprove(this.token, this.spender, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });
  });

  describe('with token that returns false on all calls', function () {
    beforeEach(async function () {
      this.token = this.erc20ReturnFalseMock;
    });

    it('reverts on transfer', async function () {
      await expect(this.mock.$safeTransfer(this.token, this.receiver, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('returns false on trySafeTransfer', async function () {
      await expect(this.mock.$trySafeTransfer(this.token, this.receiver, 0n))
        .to.emit(this.mock, 'return$trySafeTransfer')
        .withArgs(false);
    });

    it('reverts on transferFrom', async function () {
      await expect(this.mock.$safeTransferFrom(this.token, this.mock, this.receiver, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('returns false on trySafeTransferFrom', async function () {
      await expect(this.mock.$trySafeTransferFrom(this.token, this.mock, this.receiver, 0n))
        .to.emit(this.mock, 'return$trySafeTransferFrom')
        .withArgs(false);
    });

    it('reverts on increaseAllowance', async function () {
      await expect(this.mock.$safeIncreaseAllowance(this.token, this.spender, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('reverts on decreaseAllowance', async function () {
      await expect(this.mock.$safeDecreaseAllowance(this.token, this.spender, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('reverts on forceApprove', async function () {
      await expect(this.mock.$forceApprove(this.token, this.spender, 0n))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });
  });

  describe('with token that returns true on all calls', function () {
    beforeEach(async function () {
      this.token = this.erc20ReturnTrueMock;
    });

    shouldOnlyRevertOnErrors();
  });

  describe('with token that returns no boolean values', function () {
    beforeEach(async function () {
      this.token = this.erc20NoReturnMock;
    });

    shouldOnlyRevertOnErrors();
  });

  describe('with usdt approval behaviour', function () {
    beforeEach(async function () {
      this.token = this.erc20ForceApproveMock;
    });

    describe('with initial approval', function () {
      beforeEach(async function () {
        await this.token.$_approve(this.mock, this.spender, 100n);
      });

      it('safeIncreaseAllowance works', async function () {
        await this.mock.$safeIncreaseAllowance(this.token, this.spender, 10n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(110n);
      });

      it('safeDecreaseAllowance works', async function () {
        await this.mock.$safeDecreaseAllowance(this.token, this.spender, 10n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(90n);
      });

      it('forceApprove works', async function () {
        await this.mock.$forceApprove(this.token, this.spender, 200n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(200n);
      });
    });
  });

  describe('with standard ERC1363', function () {
    beforeEach(async function () {
      this.token = this.erc1363Mock;
    });

    shouldOnlyRevertOnErrors();

    describe('transferAndCall', function () {
      it('cannot transferAndCall to an EOA directly', async function () {
        await this.token.$_mint(this.owner, 100n);

        await expect(this.token.connect(this.owner).transferAndCall(this.receiver, value, ethers.Typed.bytes(data)))
          .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
          .withArgs(this.receiver);
      });

      it('can transferAndCall to an EOA using helper', async function () {
        await this.token.$_mint(this.mock, value);

        await expect(this.mock.$transferAndCallRelaxed(this.token, this.receiver, value, data))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.mock, this.receiver, value);
      });

      it('can transferAndCall to an ERC1363Receiver using helper', async function () {
        await this.token.$_mint(this.mock, value);

        await expect(this.mock.$transferAndCallRelaxed(this.token, this.erc1363Receiver, value, data))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.mock, this.erc1363Receiver, value)
          .to.emit(this.erc1363Receiver, 'Received')
          .withArgs(this.mock, this.mock, value, data);
      });
    });

    describe('transferFromAndCall', function () {
      it('can transferFromAndCall to an EOA using helper', async function () {
        await this.token.$_mint(this.owner, value);
        await this.token.$_approve(this.owner, this.mock, ethers.MaxUint256);

        await expect(this.mock.$transferFromAndCallRelaxed(this.token, this.owner, this.receiver, value, data))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.owner, this.receiver, value);
      });

      it('can transferFromAndCall to an ERC1363Receiver using helper', async function () {
        await this.token.$_mint(this.owner, value);
        await this.token.$_approve(this.owner, this.mock, ethers.MaxUint256);

        await expect(this.mock.$transferFromAndCallRelaxed(this.token, this.owner, this.erc1363Receiver, value, data))
          .to.emit(this.token, 'Transfer')
          .withArgs(this.owner, this.erc1363Receiver, value)
          .to.emit(this.erc1363Receiver, 'Received')
          .withArgs(this.mock, this.owner, value, data);
      });
    });

    describe('approveAndCall', function () {
      it('can approveAndCall to an EOA using helper', async function () {
        await expect(this.mock.$approveAndCallRelaxed(this.token, this.receiver, value, data))
          .to.emit(this.token, 'Approval')
          .withArgs(this.mock, this.receiver, value);
      });

      it('can approveAndCall to an ERC1363Spender using helper', async function () {
        await expect(this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, value, data))
          .to.emit(this.token, 'Approval')
          .withArgs(this.mock, this.erc1363Spender, value)
          .to.emit(this.erc1363Spender, 'Approved')
          .withArgs(this.mock, value, data);
      });
    });
  });

  describe('with ERC1363 that returns false on all ERC20 calls', function () {
    beforeEach(async function () {
      this.token = this.erc1363ReturnFalseOnErc20Mock;
    });

    it('reverts on transferAndCallRelaxed', async function () {
      await expect(this.mock.$transferAndCallRelaxed(this.token, this.erc1363Receiver, 0n, data))
        .to.be.revertedWithCustomError(this.token, 'ERC1363TransferFailed')
        .withArgs(this.erc1363Receiver, 0n);
    });

    it('reverts on transferFromAndCallRelaxed', async function () {
      await expect(this.mock.$transferFromAndCallRelaxed(this.token, this.mock, this.erc1363Receiver, 0n, data))
        .to.be.revertedWithCustomError(this.token, 'ERC1363TransferFromFailed')
        .withArgs(this.mock, this.erc1363Receiver, 0n);
    });

    it('reverts on approveAndCallRelaxed', async function () {
      await expect(this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, 0n, data))
        .to.be.revertedWithCustomError(this.token, 'ERC1363ApproveFailed')
        .withArgs(this.erc1363Spender, 0n);
    });
  });

  describe('with ERC1363 that returns false on all ERC1363 calls', function () {
    beforeEach(async function () {
      this.token = this.erc1363ReturnFalseMock;
    });

    it('reverts on transferAndCallRelaxed', async function () {
      await expect(this.mock.$transferAndCallRelaxed(this.token, this.erc1363Receiver, 0n, data))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('reverts on transferFromAndCallRelaxed', async function () {
      await expect(this.mock.$transferFromAndCallRelaxed(this.token, this.mock, this.erc1363Receiver, 0n, data))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });

    it('reverts on approveAndCallRelaxed', async function () {
      await expect(this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, 0n, data))
        .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedOperation')
        .withArgs(this.token);
    });
  });

  describe('with ERC1363 that returns no boolean values', function () {
    beforeEach(async function () {
      this.token = this.erc1363NoReturnMock;
    });

    it('reverts on transferAndCallRelaxed', async function () {
      await expect(
        this.mock.$transferAndCallRelaxed(this.token, this.erc1363Receiver, 0n, data),
      ).to.be.revertedWithoutReason();
    });

    it('reverts on transferFromAndCallRelaxed', async function () {
      await expect(
        this.mock.$transferFromAndCallRelaxed(this.token, this.mock, this.erc1363Receiver, 0n, data),
      ).to.be.revertedWithoutReason();
    });

    it('reverts on approveAndCallRelaxed', async function () {
      await expect(
        this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, 0n, data),
      ).to.be.revertedWithoutReason();
    });
  });

  describe('with ERC1363 with usdt approval behaviour', function () {
    beforeEach(async function () {
      this.token = this.erc1363ForceApproveMock;
    });

    describe('without initial approval', function () {
      it('approveAndCallRelaxed works when recipient is an EOA', async function () {
        await this.mock.$approveAndCallRelaxed(this.token, this.spender, 10n, data);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(10n);
      });

      it('approveAndCallRelaxed works when recipient is a contract', async function () {
        await this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, 10n, data);
        expect(await this.token.allowance(this.mock, this.erc1363Spender)).to.equal(10n);
      });
    });

    describe('with initial approval', function () {
      it('approveAndCallRelaxed works when recipient is an EOA', async function () {
        await this.token.$_approve(this.mock, this.spender, 100n);

        await this.mock.$approveAndCallRelaxed(this.token, this.spender, 10n, data);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(10n);
      });

      it('approveAndCallRelaxed reverts when recipient is a contract', async function () {
        await this.token.$_approve(this.mock, this.erc1363Spender, 100n);
        await expect(this.mock.$approveAndCallRelaxed(this.token, this.erc1363Spender, 10n, data)).to.be.revertedWith(
          'USDT approval failure',
        );
      });
    });
  });
});

function shouldOnlyRevertOnErrors() {
  describe('transfers', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, 100n);
      await this.token.$_mint(this.mock, 100n);
      await this.token.$_approve(this.owner, this.mock, ethers.MaxUint256);
    });

    it("doesn't revert on transfer", async function () {
      await expect(this.mock.$safeTransfer(this.token, this.receiver, 10n))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.mock, this.receiver, 10n);
    });

    it('returns true on trySafeTransfer', async function () {
      await expect(this.mock.$trySafeTransfer(this.token, this.receiver, 10n))
        .to.emit(this.mock, 'return$trySafeTransfer')
        .withArgs(true);
    });

    it("doesn't revert on transferFrom", async function () {
      await expect(this.mock.$safeTransferFrom(this.token, this.owner, this.receiver, 10n))
        .to.emit(this.token, 'Transfer')
        .withArgs(this.owner, this.receiver, 10n);
    });

    it('returns true on trySafeTransferFrom', async function () {
      await expect(this.mock.$trySafeTransferFrom(this.token, this.owner, this.receiver, 10n))
        .to.emit(this.mock, 'return$trySafeTransferFrom')
        .withArgs(true);
    });
  });

  describe('approvals', function () {
    describe('with zero allowance', function () {
      beforeEach(async function () {
        await this.token.$_approve(this.mock, this.spender, 0n);
      });

      it("doesn't revert when force approving a non-zero allowance", async function () {
        await this.mock.$forceApprove(this.token, this.spender, 100n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(100n);
      });

      it("doesn't revert when force approving a zero allowance", async function () {
        await this.mock.$forceApprove(this.token, this.spender, 0n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(0n);
      });

      it("doesn't revert when increasing the allowance", async function () {
        await this.mock.$safeIncreaseAllowance(this.token, this.spender, 10n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(10n);
      });

      it('reverts when decreasing the allowance', async function () {
        await expect(this.mock.$safeDecreaseAllowance(this.token, this.spender, 10n))
          .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedDecreaseAllowance')
          .withArgs(this.spender, 0n, 10n);
      });
    });

    describe('with non-zero allowance', function () {
      beforeEach(async function () {
        await this.token.$_approve(this.mock, this.spender, 100n);
      });

      it("doesn't revert when force approving a non-zero allowance", async function () {
        await this.mock.$forceApprove(this.token, this.spender, 20n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(20n);
      });

      it("doesn't revert when force approving a zero allowance", async function () {
        await this.mock.$forceApprove(this.token, this.spender, 0n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(0n);
      });

      it("doesn't revert when increasing the allowance", async function () {
        await this.mock.$safeIncreaseAllowance(this.token, this.spender, 10n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(110n);
      });

      it("doesn't revert when decreasing the allowance to a positive value", async function () {
        await this.mock.$safeDecreaseAllowance(this.token, this.spender, 50n);
        expect(await this.token.allowance(this.mock, this.spender)).to.equal(50n);
      });

      it('reverts when decreasing the allowance to a negative value', async function () {
        await expect(this.mock.$safeDecreaseAllowance(this.token, this.spender, 200n))
          .to.be.revertedWithCustomError(this.mock, 'SafeERC20FailedDecreaseAllowance')
          .withArgs(this.spender, 100n, 200n);
      });
    });
  });
}
