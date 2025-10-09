const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { ERC4337Helper } = require('../../helpers/erc4337');
const {
  MODULE_TYPE_EXECUTOR,
  encodeSingle,
  encodeMode,
  CALL_TYPE_CALL,
  EXEC_TYPE_DEFAULT,
} = require('../../helpers/erc7579');

const { shouldBehaveLikeERC7579Module } = require('./ERC7579Module.behavior');

async function fixture() {
  // Deploy ERC-7579 validator module
  const mock = await ethers.deployContract('$ERC7579ExecutorMock');
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();

  // Prepare module installation data
  const installData = '0x';

  // ERC-7579 account
  const mockAccount = await helper.newAccount('$AccountERC7579');
  const mockFromAccount = await impersonate(mockAccount.address).then(asAccount => mock.connect(asAccount));

  const moduleType = MODULE_TYPE_EXECUTOR;

  await mockAccount.deploy();
  await impersonate(predeploy.entrypoint.v08.target).then(asEntrypoint =>
    mockAccount.connect(asEntrypoint).installModule(moduleType, mock.target, installData),
  );

  const args = [42, '0x1234'];
  const data = target.interface.encodeFunctionData('mockFunctionWithArgs', args);
  const calldata = encodeSingle(target, 0, data);
  const mode = encodeMode({ callType: CALL_TYPE_CALL, execType: EXEC_TYPE_DEFAULT });

  return {
    moduleType,
    mock,
    mockAccount,
    mockFromAccount,
    target,
    installData,
    args,
    data,
    calldata,
    mode,
  };
}

describe('ERC7579Executor', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('execute', function () {
    it('succeeds', async function () {
      await expect(this.mockFromAccount.$_execute(this.mockAccount.address, ethers.ZeroHash, this.mode, this.calldata))
        .to.emit(this.mock, 'ERC7579ExecutorOperationExecuted')
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(...this.args);
    });
  });

  shouldBehaveLikeERC7579Module();
});
