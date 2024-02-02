const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { RevertType } = require('../../../helpers/enums');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const firstTokenId = 1n;
const secondTokenId = 2n;
const firstTokenValue = 1000n;
const secondTokenValue = 1000n;

const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81';

const deployReceiver = (
  revertType,
  returnValueSingle = RECEIVER_SINGLE_MAGIC_VALUE,
  returnValueBatched = RECEIVER_BATCH_MAGIC_VALUE,
) => ethers.deployContract('$ERC1155ReceiverMock', [returnValueSingle, returnValueBatched, revertType]);

const fixture = async () => {
  const [eoa, operator, owner] = await ethers.getSigners();
  const utils = await ethers.deployContract('$ERC1155Utils');

  const receivers = {
    correct: await deployReceiver(RevertType.None),
    invalid: await deployReceiver(RevertType.None, '0xdeadbeef', '0xdeadbeef'),
    message: await deployReceiver(RevertType.RevertWithMessage),
    empty: await deployReceiver(RevertType.RevertWithoutMessage),
    customError: await deployReceiver(RevertType.RevertWithCustomError),
    panic: await deployReceiver(RevertType.Panic),
    nonReceiver: await ethers.deployContract('CallReceiverMock'),
    eoa,
  };

  return { operator, owner, utils, receivers };
};

describe('ERC1155Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('onERC1155Received', function () {
    it('succeeds when called by an EOA', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.eoa,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      ).to.not.be.reverted;
    });

    it('succeeds when data is passed', async function () {
      const data = '0x12345678';
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.correct,
          firstTokenId,
          firstTokenValue,
          data,
        ),
      ).to.not.be.reverted;
    });

    it('succeeds when data is empty', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.correct,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      ).to.not.be.reverted;
    });

    it('reverts when receiver returns invalid value', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.invalid,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.invalid);
    });

    it('reverts when receiver reverts with message', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.message,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      ).to.be.revertedWith('ERC1155ReceiverMock: reverting on receive');
    });

    it('reverts when receiver reverts without message', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.empty,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.empty);
    });

    it('reverts when receiver reverts with custom error', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.customError,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.receivers.customError, 'CustomError')
        .withArgs(RECEIVER_SINGLE_MAGIC_VALUE);
    });

    it('reverts when receiver panics', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.panic,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      ).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
    });

    it('reverts when receiver does not implement onERC1155Received', async function () {
      await expect(
        this.utils.$checkOnERC1155Received(
          this.operator,
          this.owner,
          this.receivers.nonReceiver,
          firstTokenId,
          firstTokenValue,
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.nonReceiver);
    });
  });

  describe('onERC1155BatchReceived', function () {
    it('succeeds when called by an EOA', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.eoa,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      ).to.not.be.reverted;
    });

    it('succeeds when data is passed', async function () {
      const data = '0x12345678';
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.correct,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          data,
        ),
      ).to.not.be.reverted;
    });

    it('succeeds when data is empty', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.correct,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      ).to.not.be.reverted;
    });

    it('reverts when receiver returns invalid value', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.invalid,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.invalid);
    });

    it('reverts when receiver reverts with message', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.message,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      ).to.be.revertedWith('ERC1155ReceiverMock: reverting on batch receive');
    });

    it('reverts when receiver reverts without message', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.empty,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.empty);
    });

    it('reverts when receiver reverts with custom error', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.customError,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.receivers.customError, 'CustomError')
        .withArgs(RECEIVER_SINGLE_MAGIC_VALUE);
    });

    it('reverts when receiver panics', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.panic,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      ).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
    });

    it('reverts when receiver does not implement onERC1155BatchReceived', async function () {
      await expect(
        this.utils.$checkOnERC1155BatchReceived(
          this.operator,
          this.owner,
          this.receivers.nonReceiver,
          [firstTokenId, secondTokenId],
          [firstTokenValue, secondTokenValue],
          '0x',
        ),
      )
        .to.be.revertedWithCustomError(this.utils, 'ERC1155InvalidReceiver')
        .withArgs(this.receivers.nonReceiver);
    });
  });
});
