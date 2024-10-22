const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, setBalance } = require('@nomicfoundation/hardhat-network-helpers');
const {
  EXEC_TYPE_DEFAULT,
  EXEC_TYPE_TRY,
  encodeSingle,
  encodeBatch,
  encodeDelegate,
  CALL_TYPE_CALL,
  CALL_TYPE_BATCH,
  encodeMode,
} = require('../../helpers/erc7579');
const { selector } = require('../../helpers/methods');

const coder = ethers.AbiCoder.defaultAbiCoder();

const fixture = async () => {
  const [sender] = await ethers.getSigners();
  const utils = await ethers.deployContract('$ERC7579Utils');
  const utilsGlobal = await ethers.deployContract('$ERC7579UtilsGlobalMock');
  const target = await ethers.deployContract('CallReceiverMock');
  const anotherTarget = await ethers.deployContract('CallReceiverMock');
  await setBalance(utils.target, ethers.parseEther('1'));
  return { utils, utilsGlobal, target, anotherTarget, sender };
};

describe('ERC7579Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('execSingle', function () {
    it('calls the target with value', async function () {
      const value = 0x012;
      const data = encodeSingle(this.target, value, this.target.interface.encodeFunctionData('mockFunction'));

      await expect(this.utils.$execSingle(EXEC_TYPE_DEFAULT, data)).to.emit(this.target, 'MockFunctionCalled');

      expect(ethers.provider.getBalance(this.target)).to.eventually.equal(value);
    });

    it('calls the target with value and args', async function () {
      const value = 0x432;
      const data = encodeSingle(
        this.target,
        value,
        this.target.interface.encodeFunctionData('mockFunctionWithArgs', [42, '0x1234']),
      );

      await expect(this.utils.$execSingle(EXEC_TYPE_DEFAULT, data))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(42, '0x1234');

      expect(ethers.provider.getBalance(this.target)).to.eventually.equal(value);
    });

    it('reverts when target reverts in default ExecType', async function () {
      const value = 0x012;
      const data = encodeSingle(
        this.target,
        value,
        this.target.interface.encodeFunctionData('mockFunctionRevertsReason'),
      );

      await expect(this.utils.$execSingle(EXEC_TYPE_DEFAULT, data)).to.be.revertedWith('CallReceiverMock: reverting');
    });

    it('emits ERC7579TryExecuteFail event when target reverts in try ExecType', async function () {
      const value = 0x012;
      const data = encodeSingle(
        this.target,
        value,
        this.target.interface.encodeFunctionData('mockFunctionRevertsReason'),
      );

      await expect(this.utils.$execSingle(EXEC_TYPE_TRY, data))
        .to.emit(this.utils, 'ERC7579TryExecuteFail')
        .withArgs(
          CALL_TYPE_CALL,
          ethers.solidityPacked(
            ['bytes4', 'bytes'],
            [selector('Error(string)'), coder.encode(['string'], ['CallReceiverMock: reverting'])],
          ),
        );
    });

    it('reverts with an invalid exec type', async function () {
      const value = 0x012;
      const data = encodeSingle(this.target, value, this.target.interface.encodeFunctionData('mockFunction'));

      await expect(this.utils.$execSingle('0x03', data))
        .to.be.revertedWithCustomError(this.utils, 'ERC7579UnsupportedExecType')
        .withArgs('0x03');
    });
  });

  describe('execBatch', function () {
    it('calls the targets with value', async function () {
      const value1 = 0x012;
      const value2 = 0x234;
      const data = encodeBatch(
        [this.target, value1, this.target.interface.encodeFunctionData('mockFunction')],
        [this.anotherTarget, value2, this.anotherTarget.interface.encodeFunctionData('mockFunction')],
      );

      await expect(this.utils.$execBatch(EXEC_TYPE_DEFAULT, data))
        .to.emit(this.target, 'MockFunctionCalled')
        .to.emit(this.anotherTarget, 'MockFunctionCalled');

      expect(ethers.provider.getBalance(this.target)).to.eventually.equal(value1);
      expect(ethers.provider.getBalance(this.anotherTarget)).to.eventually.equal(value2);
    });

    it('calls the targets with value and args', async function () {
      const value1 = 0x012;
      const value2 = 0x234;
      const data = encodeBatch(
        [this.target, value1, this.target.interface.encodeFunctionData('mockFunctionWithArgs', [42, '0x1234'])],
        [
          this.anotherTarget,
          value2,
          this.anotherTarget.interface.encodeFunctionData('mockFunctionWithArgs', [42, '0x1234']),
        ],
      );

      await expect(this.utils.$execBatch(EXEC_TYPE_DEFAULT, data))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .to.emit(this.anotherTarget, 'MockFunctionCalledWithArgs');

      expect(ethers.provider.getBalance(this.target)).to.eventually.equal(value1);
      expect(ethers.provider.getBalance(this.anotherTarget)).to.eventually.equal(value2);
    });

    it('reverts when any target reverts in default ExecType', async function () {
      const value1 = 0x012;
      const value2 = 0x234;
      const data = encodeBatch(
        [this.target, value1, this.target.interface.encodeFunctionData('mockFunction')],
        [this.anotherTarget, value2, this.anotherTarget.interface.encodeFunctionData('mockFunctionRevertsReason')],
      );

      await expect(this.utils.$execBatch(EXEC_TYPE_DEFAULT, data)).to.be.revertedWith('CallReceiverMock: reverting');
    });

    it('emits ERC7579TryExecuteFail event when any target reverts in try ExecType', async function () {
      const value1 = 0x012;
      const value2 = 0x234;
      const data = encodeBatch(
        [this.target, value1, this.target.interface.encodeFunctionData('mockFunction')],
        [this.anotherTarget, value2, this.anotherTarget.interface.encodeFunctionData('mockFunctionRevertsReason')],
      );

      await expect(this.utils.$execBatch(EXEC_TYPE_TRY, data))
        .to.emit(this.utils, 'ERC7579TryExecuteFail')
        .withArgs(
          CALL_TYPE_BATCH,
          ethers.solidityPacked(
            ['bytes4', 'bytes'],
            [selector('Error(string)'), coder.encode(['string'], ['CallReceiverMock: reverting'])],
          ),
        );

      // Check balances
      expect(ethers.provider.getBalance(this.target)).to.eventually.equal(value1);
      expect(ethers.provider.getBalance(this.anotherTarget)).to.eventually.equal(0);
    });

    it('reverts with an invalid exec type', async function () {
      const value1 = 0x012;
      const value2 = 0x234;
      const data = encodeBatch(
        [this.target, value1, this.target.interface.encodeFunctionData('mockFunction')],
        [this.anotherTarget, value2, this.anotherTarget.interface.encodeFunctionData('mockFunction')],
      );

      await expect(this.utils.$execBatch('0x03', data))
        .to.be.revertedWithCustomError(this.utils, 'ERC7579UnsupportedExecType')
        .withArgs('0x03');
    });
  });

  describe('execDelegateCall', function () {
    it('delegate calls the target', async function () {
      const slot = ethers.hexlify(ethers.randomBytes(32));
      const value = ethers.hexlify(ethers.randomBytes(32));
      const data = encodeDelegate(
        this.target,
        this.target.interface.encodeFunctionData('mockFunctionWritesStorage', [slot, value]),
      );

      expect(ethers.provider.getStorage(this.utils.target, slot)).to.eventually.equal(ethers.ZeroHash);
      await this.utils.$execDelegateCall(EXEC_TYPE_DEFAULT, data);
      expect(ethers.provider.getStorage(this.utils.target, slot)).to.eventually.equal(value);
    });

    it('reverts when target reverts in default ExecType', async function () {
      const data = encodeDelegate(this.target, this.target.interface.encodeFunctionData('mockFunctionRevertsReason'));
      await expect(this.utils.$execDelegateCall(EXEC_TYPE_DEFAULT, data)).to.be.revertedWith(
        'CallReceiverMock: reverting',
      );
    });

    it('emits ERC7579TryExecuteFail event when target reverts in try ExecType', async function () {
      const data = encodeDelegate(this.target, this.target.interface.encodeFunctionData('mockFunctionRevertsReason'));
      await expect(this.utils.$execDelegateCall(EXEC_TYPE_TRY, data))
        .to.emit(this.utils, 'ERC7579TryExecuteFail')
        .withArgs(
          CALL_TYPE_CALL,
          ethers.solidityPacked(
            ['bytes4', 'bytes'],
            [selector('Error(string)'), coder.encode(['string'], ['CallReceiverMock: reverting'])],
          ),
        );
    });

    it('reverts with an invalid exec type', async function () {
      const data = encodeDelegate(this.target, this.target.interface.encodeFunctionData('mockFunction'));
      await expect(this.utils.$execDelegateCall('0x03', data))
        .to.be.revertedWithCustomError(this.utils, 'ERC7579UnsupportedExecType')
        .withArgs('0x03');
    });
  });

  it('encodes Mode', async function () {
    const callType = CALL_TYPE_BATCH;
    const execType = EXEC_TYPE_TRY;
    const selector = '0x12345678';
    const payload = ethers.toBeHex(0, 22);

    expect(this.utils.$encodeMode(callType, execType, selector, payload)).to.eventually.equal(
      encodeMode({
        callType,
        execType,
        selector,
        payload,
      }),
    );
  });

  it('decodes Mode', async function () {
    const callType = CALL_TYPE_BATCH;
    const execType = EXEC_TYPE_TRY;
    const selector = '0x12345678';
    const payload = ethers.toBeHex(0, 22);

    expect(
      this.utils.$decodeMode(
        encodeMode({
          callType,
          execType,
          selector,
          payload,
        }),
      ),
    ).to.eventually.deep.equal([callType, execType, selector, payload]);
  });

  it('encodes single', async function () {
    const target = this.target;
    const value = 0x123;
    const data = '0x12345678';

    expect(this.utils.$encodeSingle(target, value, data)).to.eventually.equal(encodeSingle(target, value, data));
  });

  it('decodes single', async function () {
    const target = this.target;
    const value = 0x123;
    const data = '0x12345678';

    expect(this.utils.$decodeSingle(encodeSingle(target, value, data))).to.eventually.deep.equal([
      target.target,
      value,
      data,
    ]);
  });

  it('encodes batch', async function () {
    const entries = [
      [this.target, 0x123, '0x12345678'],
      [this.anotherTarget, 0x456, '0x12345678'],
    ];

    expect(this.utils.$encodeBatch(entries)).to.eventually.equal(encodeBatch(...entries));
  });

  it('decodes batch', async function () {
    const entries = [
      [this.target.target, 0x123, '0x12345678'],
      [this.anotherTarget.target, 0x456, '0x12345678'],
    ];

    expect(this.utils.$decodeBatch(encodeBatch(...entries))).to.eventually.deep.equal(entries);
  });

  it('encodes delegate', async function () {
    const target = this.target;
    const data = '0x12345678';

    expect(this.utils.$encodeDelegate(target, data)).to.eventually.equal(encodeDelegate(target, data));
  });

  it('decodes delegate', async function () {
    const target = this.target;
    const data = '0x12345678';

    expect(this.utils.$decodeDelegate(encodeDelegate(target, data))).to.eventually.deep.equal([target.target, data]);
  });

  describe('global', function () {
    describe('eqCallTypeGlobal', function () {
      it('returns true if both call types are equal', async function () {
        expect(this.utilsGlobal.$eqCallTypeGlobal(CALL_TYPE_BATCH, CALL_TYPE_BATCH)).to.eventually.be.true;
      });

      it('returns false if both call types are different', async function () {
        expect(this.utilsGlobal.$eqCallTypeGlobal(CALL_TYPE_CALL, CALL_TYPE_BATCH)).to.eventually.be.false;
      });
    });

    describe('eqExecTypeGlobal', function () {
      it('returns true if both exec types are equal', async function () {
        expect(this.utilsGlobal.$eqExecTypeGlobal(EXEC_TYPE_TRY, EXEC_TYPE_TRY)).to.eventually.be.true;
      });

      it('returns false if both exec types are different', async function () {
        expect(this.utilsGlobal.$eqExecTypeGlobal(EXEC_TYPE_DEFAULT, EXEC_TYPE_TRY)).to.eventually.be.false;
      });
    });

    describe('eqModeSelectorGlobal', function () {
      it('returns true if both selectors are equal', async function () {
        expect(this.utilsGlobal.$eqModeSelectorGlobal('0x12345678', '0x12345678')).to.eventually.be.true;
      });

      it('returns false if both selectors are different', async function () {
        expect(this.utilsGlobal.$eqModeSelectorGlobal('0x12345678', '0x87654321')).to.eventually.be.false;
      });
    });

    describe('eqModePayloadGlobal', function () {
      it('returns true if both payloads are equal', async function () {
        expect(this.utilsGlobal.$eqModePayloadGlobal(ethers.toBeHex(0, 22), ethers.toBeHex(0, 22))).to.eventually.be
          .true;
      });

      it('returns false if both payloads are different', async function () {
        expect(this.utilsGlobal.$eqModePayloadGlobal(ethers.toBeHex(0, 22), ethers.toBeHex(1, 22))).to.eventually.be
          .false;
      });
    });
  });
});
