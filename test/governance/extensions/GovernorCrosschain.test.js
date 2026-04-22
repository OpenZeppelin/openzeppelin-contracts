import { network } from 'hardhat';
import { expect } from 'chai';

import { CALL_TYPE_CALL, encodeMode, encodeSingle } from '../../helpers/erc7579';
import { GovernorHelper } from '../../helpers/governance';
import { VoteType } from '../../helpers/enums';

const connection = await network.create();
const {
  ethers,
  helpers,
  networkHelpers: { loadFixture },
} = connection;

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

async function fixture() {
  const [owner, proposer, voter1, voter2, voter3, voter4] = await ethers.getSigners();

  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const receiver = await ethers.deployContract('CallReceiverMock');

  // Deploy governance
  const token = await ethers.deployContract('$ERC20Votes', [tokenName, tokenSymbol, tokenName, version]);
  const governor = await ethers.deployContract('$GovernorCrosschainMock', [
    name, // name
    votingDelay, // initialVotingDelay
    votingPeriod, // initialVotingPeriod
    0n, // initialProposalThreshold
    token, // tokenAddress
    10n, // quorumNumeratorValue
  ]);

  // Deploy executor
  const executor = await ethers.deployContract('$CrosschainRemoteExecutor', [
    gateway,
    helpers.chain.toErc7930(governor),
  ]);

  await owner.sendTransaction({ to: governor, value });
  await token.$_mint(owner, tokenSupply);

  const helper = new GovernorHelper(connection, governor, 'blocknumber');
  await helper.connect(owner).delegate({ token: token, to: voter1, value: ethers.parseEther('10') });
  await helper.connect(owner).delegate({ token: token, to: voter2, value: ethers.parseEther('7') });
  await helper.connect(owner).delegate({ token: token, to: voter3, value: ethers.parseEther('5') });
  await helper.connect(owner).delegate({ token: token, to: voter4, value: ethers.parseEther('2') });

  return {
    owner,
    proposer,
    voter1,
    voter2,
    voter3,
    voter4,
    gateway,
    receiver,
    token,
    governor,
    executor,
    helper,
  };
}

describe('GovernorCrosschain', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('execute with executor', async function () {
    this.helper.setProposal(
      [
        {
          target: this.governor.target,
          data: this.governor.interface.encodeFunctionData('relayCrosschain(address,bytes,bytes32,bytes)', [
            this.gateway.target,
            helpers.chain.toErc7930(this.executor),
            encodeMode({ callType: CALL_TYPE_CALL }),
            encodeSingle(this.receiver, 0n, this.receiver.interface.encodeFunctionData('mockFunctionExtra')),
          ]),
        },
      ],
      '<proposal description>',
    );

    await this.helper.propose();
    await this.helper.waitForSnapshot();
    await this.helper.connect(this.voter1).vote({ support: VoteType.For });
    await this.helper.connect(this.voter2).vote({ support: VoteType.For });
    await this.helper.waitForDeadline();

    await expect(this.helper.execute()).to.emit(this.receiver, 'MockFunctionCalledExtra').withArgs(this.executor, 0n);
  });

  it('relayCrosschain is onlyGovernance', async function () {
    await expect(
      this.governor.getFunction('relayCrosschain(address,bytes,bytes32,bytes)')(
        this.gateway,
        helpers.chain.toErc7930(this.executor),
        encodeMode({ callType: CALL_TYPE_CALL }),
        encodeSingle(this.receiver, 0n, this.receiver.interface.encodeFunctionData('mockFunctionExtra')),
      ),
    ).to.be.revertedWithCustomError(this.governor, 'GovernorOnlyExecutor');
  });

  it('reconfigure executor', async function () {
    const newGovernor = await ethers.deployContract('$GovernorCrosschainMock', [
      name, // name
      votingDelay, // initialVotingDelay
      votingPeriod, // initialVotingPeriod
      0n, // initialProposalThreshold
      this.token, // tokenAddress
      10n, // quorumNumeratorValue
    ]);

    // Before reconfiguration
    await expect(this.executor.gateway()).to.eventually.equal(this.gateway);
    await expect(this.executor.controller()).to.eventually.equal(helpers.chain.toErc7930(this.governor));

    // Propose reconfiguration
    this.helper.setProposal(
      [
        {
          target: this.governor.target,
          data: this.governor.interface.encodeFunctionData('relayCrosschain(address,bytes,bytes32,bytes)', [
            this.gateway.target,
            helpers.chain.toErc7930(this.executor),
            encodeMode({ callType: CALL_TYPE_CALL }),
            encodeSingle(
              this.executor,
              0n,
              this.executor.interface.encodeFunctionData('reconfigure', [
                this.gateway.target,
                helpers.chain.toErc7930(newGovernor),
              ]),
            ),
          ]),
        },
      ],
      '<proposal description>',
    );

    await this.helper.propose();
    await this.helper.waitForSnapshot();
    await this.helper.connect(this.voter1).vote({ support: VoteType.For });
    await this.helper.connect(this.voter2).vote({ support: VoteType.For });
    await this.helper.waitForDeadline();

    await expect(this.helper.execute())
      .to.emit(this.executor, 'CrosschainControllerSet')
      .withArgs(this.gateway, helpers.chain.toErc7930(newGovernor));

    // After reconfiguration
    await expect(this.executor.gateway()).to.eventually.equal(this.gateway);
    await expect(this.executor.controller()).to.eventually.equal(helpers.chain.toErc7930(newGovernor));
  });
});
