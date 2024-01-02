const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC20 } = require('../ERC20.behavior.js');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');
const { RevertType } = require('../../../helpers/enums.js');

const name = 'My Token';
const symbol = 'MTKN';
const value = 1000n;
const data = '0x123456';

async function fixture() {
  // this.accounts is used by shouldBehaveLikeERC20
  const accounts = await ethers.getSigners();
  const [holder, other] = accounts;

  const receiver = await ethers.deployContract('ERC1363ReceiverMock');
  const spender = await ethers.deployContract('ERC1363SpenderMock');
  const token = await ethers.deployContract('$ERC1363', [name, symbol]);

  await token.$_mint(holder, value);

  return {
    accounts,
    holder,
    other,
    token,
    receiver,
    spender,
    selectors: {
      onTransferReceived: receiver.interface.getFunction('onTransferReceived(address,address,uint256,bytes)').selector,
      onApprovalReceived: spender.interface.getFunction('onApprovalReceived(address,uint256,bytes)').selector,
    },
  };
}

describe('ERC1363', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces(['ERC165', 'ERC1363']);
  shouldBehaveLikeERC20(value);
  // Note: transferAndCall(address,uint256) fails "shouldBehaveLikeERC20Transfer" because it revert on EOAs
  // Note: transferAndCall(address,uint256,bytes) fails "shouldBehaveLikeERC20Transfer" because it revert on EOAs
  // Note: approveAndCall(address,uint256) fails "shouldBehaveLikeERC20Approve" because it revert on EOAs
  // Note: approveAndCall(address,uint256,bytes) fails "shouldBehaveLikeERC20Approve" because it revert on EOAs

  describe('transferAndCall', function () {
    it('to an EOA', async function () {
      await expect(this.token.connect(this.holder).getFunction('transferAndCall(address,uint256)')(this.other, value))
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.other.address);
    });

    it('without data', async function () {
      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256)')(this.receiver, value),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.receiver.target, value)
        .to.emit(this.receiver, 'Received')
        .withArgs(this.holder.address, this.holder.address, value, '0x');
    });

    it('with data', async function () {
      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.receiver.target, value)
        .to.emit(this.receiver, 'Received')
        .withArgs(this.holder.address, this.holder.address, value, data);
    });

    it('with reverting hook (without reason)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.RevertWithoutMessage);

      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.receiver.target);
    });

    it('with reverting hook (with reason)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.RevertWithMessage);

      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      ).to.be.revertedWith('ERC1363ReceiverMock: reverting');
    });

    it('with reverting hook (with custom error)', async function () {
      const reason = '0x12345678';
      await this.receiver.setUp(reason, RevertType.RevertWithCustomError);

      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.receiver, 'CustomError')
        .withArgs(reason);
    });

    it('with reverting hook (with panic)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.Panic);

      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      ).to.be.revertedWithPanic();
    });

    it('with bad return value', async function () {
      await this.receiver.setUp('0x12345678', RevertType.None);

      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.receiver.target);
    });
  });

  describe('transferFromAndCall', function () {
    beforeEach(async function () {
      await this.token.connect(this.holder).approve(this.other, ethers.MaxUint256);
    });

    it('to an EOA', async function () {
      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256)')(
          this.holder,
          this.other,
          value,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.other.address);
    });

    it('without data', async function () {
      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256)')(
          this.holder,
          this.receiver,
          value,
        ),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.receiver.target, value)
        .to.emit(this.receiver, 'Received')
        .withArgs(this.other.address, this.holder.address, value, '0x');
    });

    it('with data', async function () {
      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.receiver.target, value)
        .to.emit(this.receiver, 'Received')
        .withArgs(this.other.address, this.holder.address, value, data);
    });

    it('with reverting hook (without reason)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.RevertWithoutMessage);

      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.receiver.target);
    });

    it('with reverting hook (with reason)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.RevertWithMessage);

      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      ).to.be.revertedWith('ERC1363ReceiverMock: reverting');
    });

    it('with reverting hook (with custom error)', async function () {
      const reason = '0x12345678';
      await this.receiver.setUp(reason, RevertType.RevertWithCustomError);

      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.receiver, 'CustomError')
        .withArgs(reason);
    });

    it('with reverting hook (with panic)', async function () {
      await this.receiver.setUp(this.selectors.onTransferReceived, RevertType.Panic);

      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      ).to.be.revertedWithPanic();
    });

    it('with bad return value', async function () {
      await this.receiver.setUp('0x12345678', RevertType.None);

      await expect(
        this.token.connect(this.other).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.receiver,
          value,
          data,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidReceiver')
        .withArgs(this.receiver.target);
    });
  });

  describe('approveAndCall', function () {
    it('an EOA', async function () {
      await expect(this.token.connect(this.holder).getFunction('approveAndCall(address,uint256)')(this.other, value))
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidSpender')
        .withArgs(this.other.address);
    });

    it('without data', async function () {
      await expect(this.token.connect(this.holder).getFunction('approveAndCall(address,uint256)')(this.spender, value))
        .to.emit(this.token, 'Approval')
        .withArgs(this.holder.address, this.spender.target, value)
        .to.emit(this.spender, 'Approved')
        .withArgs(this.holder.address, value, '0x');
    });

    it('with data', async function () {
      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      )
        .to.emit(this.token, 'Approval')
        .withArgs(this.holder.address, this.spender.target, value)
        .to.emit(this.spender, 'Approved')
        .withArgs(this.holder.address, value, data);
    });

    it('with reverting hook (without reason)', async function () {
      await this.spender.setUp(this.selectors.onApprovalReceived, RevertType.RevertWithoutMessage);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidSpender')
        .withArgs(this.spender.target);
    });

    it('with reverting hook (with reason)', async function () {
      await this.spender.setUp(this.selectors.onApprovalReceived, RevertType.RevertWithMessage);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      ).to.be.revertedWith('ERC1363SpenderMock: reverting');
    });

    it('with reverting hook (with custom error)', async function () {
      const reason = '0x12345678';
      await this.spender.setUp(reason, RevertType.RevertWithCustomError);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      )
        .to.be.revertedWithCustomError(this.spender, 'CustomError')
        .withArgs(reason);
    });

    it('with reverting hook (with panic)', async function () {
      await this.spender.setUp(this.selectors.onApprovalReceived, RevertType.Panic);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      ).to.be.revertedWithPanic();
    });

    it('with bad return value', async function () {
      await this.spender.setUp('0x12345678', RevertType.None);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.spender, value, data),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC1363InvalidSpender')
        .withArgs(this.spender.target);
    });
  });
});
