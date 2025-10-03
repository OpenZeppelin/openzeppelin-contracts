const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { ERC4337Helper } = require('../../helpers/erc4337');
const {
  MODULE_TYPE_EXECUTOR,
  CALL_TYPE_CALL,
  EXEC_TYPE_DEFAULT,
  encodeMode,
  encodeSingle,
} = require('../../helpers/erc7579');
const { ERC7579OperationState } = require('../../helpers/enums');

const { shouldBehaveLikeERC7579Module } = require('./ERC7579Module.behavior');

async function fixture() {
  const [other] = await ethers.getSigners();

  // Deploy ERC-7579 validator module
  const mock = await ethers.deployContract('$ERC7579DelayedExecutorMock');
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();

  // Prepare module installation data
  const delay = time.duration.days(10);
  const expiration = time.duration.years(1);
  const installData = ethers.AbiCoder.defaultAbiCoder().encode(['uint32', 'uint32'], [delay, expiration]);

  // ERC-7579 account
  const mockAccount = await helper.newAccount('$AccountERC7579');
  const mockFromAccount = await impersonate(mockAccount.address).then(asAccount => mock.connect(asAccount));
  const mockAccountFromEntrypoint = await impersonate(predeploy.entrypoint.v08.target).then(asEntrypoint =>
    mockAccount.connect(asEntrypoint),
  );

  const moduleType = MODULE_TYPE_EXECUTOR;

  await mockAccount.deploy();

  const args = [42, '0x1234'];
  const data = target.interface.encodeFunctionData('mockFunctionWithArgs', args);
  const calldata = encodeSingle(target, 0, data);
  const mode = encodeMode({ callType: CALL_TYPE_CALL, execType: EXEC_TYPE_DEFAULT });

  return {
    moduleType,
    mock,
    mockAccount,
    mockFromAccount,
    mockAccountFromEntrypoint,
    target,
    installData,
    args,
    data,
    calldata,
    mode,
    delay,
    expiration,
    other,
  };
}

describe('ERC7579DelayedExecutor', function () {
  const salt = ethers.ZeroHash;

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7579Module();

  it('returns the correct state (complete execution)', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Unknown,
    );
    await this.mockFromAccount.schedule(this.mockAccount.address, salt, this.mode, this.calldata);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Scheduled,
    );
    await time.increase(this.delay);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Ready,
    );
    await this.mock.execute(this.mockAccount.address, salt, this.mode, this.calldata);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Executed,
    );
  });

  it('returns the correct state (expiration)', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Unknown,
    );
    await this.mockFromAccount.schedule(this.mockAccount.address, salt, this.mode, this.calldata);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Scheduled,
    );
    await time.increase(this.delay);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Ready,
    );
    await time.increase(this.expiration);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Expired,
    );
  });

  it('returns the correct state (cancellation)', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Unknown,
    );
    await this.mockFromAccount.schedule(this.mockAccount.address, salt, this.mode, this.calldata);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Scheduled,
    );
    await time.increase(this.delay);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Ready,
    );
    await this.mockFromAccount.cancel(this.mockAccount.address, salt, this.mode, this.calldata);
    await expect(this.mock.state(this.mockAccount.address, salt, this.mode, this.calldata)).to.eventually.eq(
      ERC7579OperationState.Canceled,
    );
  });

  it('sets an initial delay and expiration on installation', async function () {
    const tx = await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    const now = await time.latest();
    await expect(tx)
      .to.emit(this.mock, 'ERC7579ExecutorDelayUpdated')
      .withArgs(this.mockAccount.address, this.delay, now)
      .to.emit(this.mock, 'ERC7579ExecutorExpirationUpdated')
      .withArgs(this.mockAccount.address, this.expiration);

    // onInstall is allowed again but a noop
    await this.mockFromAccount.onInstall(
      ethers.AbiCoder.defaultAbiCoder().encode(['uint32', 'uint32'], [time.duration.days(3), time.duration.hours(12)]),
    );
    await expect(this.mock.getDelay(this.mockAccount.address)).to.eventually.deep.equal([this.delay, 0, 0]);
  });

  it('sets default delay and expiration on installation', async function () {
    const tx = await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, '0x');
    const now = await time.latest();
    await expect(tx)
      .to.emit(this.mock, 'ERC7579ExecutorDelayUpdated')
      .withArgs(this.mockAccount.address, time.duration.days(5), now)
      .to.emit(this.mock, 'ERC7579ExecutorExpirationUpdated')
      .withArgs(this.mockAccount.address, time.duration.days(60));
  });

  it('schedule delay unset and unsets expiration on uninstallation', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    const tx = await this.mockAccountFromEntrypoint.uninstallModule(this.moduleType, this.mock.target, '0x');
    const now = await time.latest();
    await expect(tx)
      .to.emit(this.mock, 'ERC7579ExecutorDelayUpdated')
      .withArgs(this.mockAccount.address, 0, now + this.delay) // Old delay
      .to.emit(this.mock, 'ERC7579ExecutorExpirationUpdated')
      .withArgs(this.mockAccount.address, 0);
  });

  it('schedules a delay update', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);

    const newDelay = time.duration.days(5);
    const tx = await this.mockFromAccount.setDelay(newDelay);
    const now = await time.latest();
    const effect = now + this.delay - newDelay;

    // Delay is scheduled, will take effect later
    await expect(tx)
      .to.emit(this.mock, 'ERC7579ExecutorDelayUpdated')
      .withArgs(this.mockAccount.address, newDelay, effect);
    await expect(this.mock.getDelay(this.mockAccount.target)).to.eventually.deep.equal([this.delay, newDelay, effect]);

    // Later, it takes effect
    await time.increaseTo(effect);
    await expect(this.mock.getDelay(this.mockAccount.target)).to.eventually.deep.equal([newDelay, 0, 0]);
  });

  it('updates the expiration', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);

    const newExpiration = time.duration.weeks(10);
    await expect(this.mockFromAccount.setExpiration(newExpiration))
      .to.emit(this.mock, 'ERC7579ExecutorExpirationUpdated')
      .withArgs(this.mockAccount.address, newExpiration);
    await expect(this.mock.getExpiration(this.mockAccount.target)).to.eventually.equal(newExpiration);
  });

  describe('scheduling', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    });

    it('schedules an operation if called by the account', async function () {
      const id = this.mock.hashOperation(this.mockAccount.address, salt, this.mode, this.calldata);
      const tx = await this.mockFromAccount.schedule(this.mockAccount.address, salt, this.mode, this.calldata);
      const now = await time.latest();
      await expect(tx)
        .to.emit(this.mock, 'ERC7579ExecutorOperationScheduled')
        .withArgs(this.mockAccount.address, id, salt, this.mode, this.calldata, now + this.delay);
      await expect(
        this.mockFromAccount.schedule(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Can't schedule twice
      await expect(
        this.mock.getSchedule(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.eventually.deep.equal([now, now + this.delay, now + this.delay + this.expiration]);
    });

    it('reverts with ERC7579ExecutorModuleNotInstalled if the module is not installed', async function () {
      await expect(
        this.mock.schedule(this.other.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorModuleNotInstalled');
    });
  });

  describe('execution', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
      const now = await time.latest();
      const [delay] = await this.mock.getDelay(this.mockAccount.address);
      await this.mock.$_scheduleAt(this.mockAccount.address, salt, this.mode, this.calldata, now, delay);
    });

    it('reverts with ERC7579ExecutorUnexpectedOperationState before delay passes with any caller', async function () {
      await expect(
        this.mock.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState');
    });

    it('reverts with ERC7579ExecutorUnexpectedOperationState before delay passes with the account as caller', async function () {
      await expect(
        this.mockFromAccount.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Allowed, not ready
    });

    it('executes if called by the account when delay passes but has not expired with any caller', async function () {
      await time.increase(this.delay);
      await expect(this.mock.execute(this.mockAccount.address, salt, this.mode, this.calldata))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(...this.args);
      await expect(
        this.mock.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Can't execute twice
    });

    it('executes if called by the account when delay passes but has not expired with the account as caller', async function () {
      await time.increase(this.delay);
      await expect(this.mockFromAccount.execute(this.mockAccount.address, salt, this.mode, this.calldata))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(...this.args);
      await expect(
        this.mockFromAccount.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Can't execute twice
    });

    it('reverts with ERC7579ExecutorUnexpectedOperationState if the operation was expired with any caller', async function () {
      await time.increase(this.delay + this.expiration);
      await expect(
        this.mock.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState');
    });

    it('reverts if the operation was expired with the account as caller', async function () {
      await time.increase(this.delay + this.expiration);
      await expect(
        this.mockFromAccount.execute(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Allowed, expired
    });
  });

  describe('cancelling', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
      const now = await time.latest();
      const [delay] = await this.mock.getDelay(this.mockAccount.address);
      await this.mock.$_scheduleAt(this.mockAccount.address, salt, this.mode, this.calldata, now, delay);
    });

    it('cancels an operation if called by the account', async function () {
      const id = this.mock.hashOperation(this.mockAccount.address, salt, this.mode, this.calldata);
      await expect(this.mockFromAccount.cancel(this.mockAccount.address, salt, this.mode, this.calldata))
        .to.emit(this.mock, 'ERC7579ExecutorOperationCanceled')
        .withArgs(this.mockAccount.address, id);
      await expect(
        this.mockFromAccount.cancel(this.mockAccount.address, salt, this.mode, this.calldata),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579ExecutorUnexpectedOperationState'); // Can't cancel twice
    });
  });
});
