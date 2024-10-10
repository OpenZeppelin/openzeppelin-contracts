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
      expect(await ethers.provider.getBalance(this.target)).to.equal(value);
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
      expect(await ethers.provider.getBalance(this.target)).to.equal(value);
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
      expect(await ethers.provider.getBalance(this.target)).to.equal(value1);
      expect(await ethers.provider.getBalance(this.anotherTarget)).to.equal(value2);
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
      expect(await ethers.provider.getBalance(this.target)).to.equal(value1);
      expect(await ethers.provider.getBalance(this.anotherTarget)).to.equal(value2);
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
      expect(await ethers.provider.getBalance(this.target)).to.equal(value1);
      expect(await ethers.provider.getBalance(this.anotherTarget)).to.equal(0);
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

      expect(await ethers.provider.getStorage(this.utils.target, slot)).to.equal(ethers.ZeroHash);
      await this.utils.$execDelegateCall(EXEC_TYPE_DEFAULT, data);
      expect(await ethers.provider.getStorage(this.utils.target, slot)).to.equal(value);
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

    const mode = await this.utils.$encodeMode(callType, execType, selector, payload);
    expect(mode).to.equal(
      encodeMode({
        callType,
        execType,
        selector,
        payload,
      }),
    );
  });

  it('decodes Mode', async function () {
    const mode = encodeMode({
      callType: CALL_TYPE_BATCH,
      execType: EXEC_TYPE_TRY,
      selector: '0x12345678',
      payload: ethers.toBeHex(0, 22),
    });

    expect(await this.utils.$decodeMode(mode)).to.deep.eq([
      CALL_TYPE_BATCH,
      EXEC_TYPE_TRY,
      '0x12345678',
      ethers.toBeHex(0, 22),
    ]);
  });

  it('encodes single', async function () {
    const target = this.target;
    const value = 0x123;
    const data = '0x12345678';

    const encoded = await this.utils.$encodeSingle(target, value, data);
    expect(encoded).to.equal(encodeSingle(target, value, data));
  });

  it('decodes single', async function () {
    const target = this.target;
    const value = 0x123;
    const data = '0x12345678';

    const encoded = encodeSingle(target, value, data);
    expect(await this.utils.$decodeSingle(encoded)).to.deep.eq([target.target, value, data]);
  });

  it('encodes batch', async function () {
    const entries = [
      [this.target, 0x123, '0x12345678'],
      [this.anotherTarget, 0x456, '0x12345678'],
    ];

    const encoded = await this.utils.$encodeBatch(entries);
    expect(encoded).to.equal(encodeBatch(...entries));
  });

  it('decodes batch', async function () {
    const entries = [
      [this.target.target, 0x123, '0x12345678'],
      [this.anotherTarget.target, 0x456, '0x12345678'],
    ];

    const encoded = encodeBatch(...entries);
    expect(await this.utils.$decodeBatch(encoded)).to.deep.eq(entries);
  });

  it('encodes delegate', async function () {
    const target = this.target;
    const data = '0x12345678';

    const encoded = await this.utils.$encodeDelegate(target, data);
    expect(encoded).to.equal(encodeDelegate(target, data));
  });

  it('decodes delegate', async function () {
    const target = this.target;
    const data = '0x12345678';

    const encoded = encodeDelegate(target, data);
    expect(await this.utils.$decodeDelegate(encoded)).to.deep.eq([target.target, data]);
  });

  describe('global', function () {
    describe('eqCallTypeGlobal', function () {
      it('returns true if both call types are equal', async function () {
        const callType = CALL_TYPE_BATCH;
        expect(await this.utilsGlobal.$eqCallTypeGlobal(callType, callType)).to.be.true;
      });

      it('returns false if both call types are different', async function () {
        expect(await this.utilsGlobal.$eqCallTypeGlobal(CALL_TYPE_CALL, CALL_TYPE_BATCH)).to.be.false;
      });
    });

    describe('eqExecTypeGlobal', function () {
      it('returns true if both exec types are equal', async function () {
        const execType = EXEC_TYPE_TRY;
        expect(await this.utilsGlobal.$eqExecTypeGlobal(execType, execType)).to.be.true;
      });

      it('returns false if both exec types are different', async function () {
        expect(await this.utilsGlobal.$eqExecTypeGlobal(EXEC_TYPE_DEFAULT, EXEC_TYPE_TRY)).to.be.false;
      });
    });

    describe('eqModeSelectorGlobal', function () {
      it('returns true if both selectors are equal', async function () {
        const selector = '0x12345678';
        expect(await this.utilsGlobal.$eqModeSelectorGlobal(selector, selector)).to.be.true;
      });

      it('returns false if both selectors are different', async function () {
        expect(await this.utilsGlobal.$eqModeSelectorGlobal('0x12345678', '0x87654321')).to.be.false;
      });
    });

    describe('eqModePayloadGlobal', function () {
      it('returns true if both payloads are equal', async function () {
        const payload = ethers.toBeHex(0, 22);
        expect(await this.utilsGlobal.$eqModePayloadGlobal(payload, payload)).to.be.true;
      });

      it('returns false if both payloads are different', async function () {
        expect(await this.utilsGlobal.$eqModePayloadGlobal(ethers.toBeHex(0, 22), ethers.toBeHex(1, 22))).to.be.false;
      });
    });
  });
});
