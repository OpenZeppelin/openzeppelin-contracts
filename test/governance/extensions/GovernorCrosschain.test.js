import { network } from 'hardhat';
import { ethers } from 'ethers';
import { expect } from 'chai';

import { ERC7786Bridge } from '../../helpers/erc7786';
import { CALL_TYPE_CALL, encodeMode, encodeSingle } from '../../helpers/erc7579';
import { GovernorHelper } from '../../helpers/governance';
import { VoteType } from '../../helpers/enums';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

async function fixture() {
  // governance lives on chain A, the executor (and what it operates on) on chain B
  const [owner, proposer, voter1, voter2, voter3, voter4] = await chainA.ethers.getSigners();

  // Deploy governance
  const token = await chainA.ethers.deployContract('$ERC20Votes', [tokenName, tokenSymbol, tokenName, version]);
  const governor = await chainA.ethers.deployContract('$GovernorCrosschainMock', [
    name, // name
    votingDelay, // initialVotingDelay
    votingPeriod, // initialVotingPeriod
    0n, // initialProposalThreshold
    token, // tokenAddress
    10n, // quorumNumeratorValue
  ]);

  // Deploy executor (and its target) on chain B, controlled by the governor on chain A
  const receiver = await chainB.ethers.deployContract('CallReceiverMock');
  const executor = await chainB.ethers.deployContract('$CrosschainRemoteExecutor', [
    bridge.gateway(chainB),
    chainA.helpers.chain.toErc7930(governor),
  ]);

  await owner.sendTransaction({ to: governor, value });
  await token.$_mint(owner, tokenSupply);

  const helper = new GovernorHelper(chainA, governor, 'blockNumber');
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
    receiver,
    token,
    governor,
    executor,
    helper,
  };
}

describe('GovernorCrosschain', function () {
  beforeEach(async function () {
    Object.assign(this, await bridge.loadFixture(fixture));
  });

  it('execute with executor', async function () {
    this.helper.setProposal(
      [
        {
          target: this.governor.target,
          data: this.governor.interface.encodeFunctionData('relayCrosschain(address,bytes,bytes32,bytes)', [
            bridge.gateway(chainA).target,
            chainB.helpers.chain.toErc7930(this.executor),
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

    await expect(this.helper.execute()).to.emit(bridge.gateway(chainA), 'MessageSent');

    // The bridge delivers the instruction on chain B.
    await expect(bridge.relay().then(([tx]) => tx))
      .to.emit(this.receiver, 'MockFunctionCalledExtra')
      .withArgs(this.executor, 0n);
  });

  it('relayCrosschain is onlyGovernance', async function () {
    await expect(
      this.governor.getFunction('relayCrosschain(address,bytes,bytes32,bytes)')(
        bridge.gateway(chainA),
        chainB.helpers.chain.toErc7930(this.executor),
        encodeMode({ callType: CALL_TYPE_CALL }),
        encodeSingle(this.receiver, 0n, this.receiver.interface.encodeFunctionData('mockFunctionExtra')),
      ),
    ).to.be.revertedWithCustomError(this.governor, 'GovernorOnlyExecutor');
  });

  it('reconfigure executor', async function () {
    const newGovernor = await chainA.ethers.deployContract('$GovernorCrosschainMock', [
      name, // name
      votingDelay, // initialVotingDelay
      votingPeriod, // initialVotingPeriod
      0n, // initialProposalThreshold
      this.token, // tokenAddress
      10n, // quorumNumeratorValue
    ]);

    // Before reconfiguration
    await expect(this.executor.gateway()).to.eventually.equal(bridge.gateway(chainB));
    await expect(this.executor.controller()).to.eventually.equal(chainA.helpers.chain.toErc7930(this.governor));

    // Propose reconfiguration
    this.helper.setProposal(
      [
        {
          target: this.governor.target,
          data: this.governor.interface.encodeFunctionData('relayCrosschain(address,bytes,bytes32,bytes)', [
            bridge.gateway(chainA).target,
            chainB.helpers.chain.toErc7930(this.executor),
            encodeMode({ callType: CALL_TYPE_CALL }),
            encodeSingle(
              this.executor,
              0n,
              this.executor.interface.encodeFunctionData('reconfigure', [
                bridge.gateway(chainB).target,
                chainA.helpers.chain.toErc7930(newGovernor),
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

    await expect(this.helper.execute()).to.emit(bridge.gateway(chainA), 'MessageSent');

    // The bridge delivers the instruction on chain B.
    await expect(bridge.relay().then(([tx]) => tx))
      .to.emit(this.executor, 'CrosschainControllerSet')
      .withArgs(bridge.gateway(chainB), chainA.helpers.chain.toErc7930(newGovernor));

    // After reconfiguration
    await expect(this.executor.gateway()).to.eventually.equal(bridge.gateway(chainB));
    await expect(this.executor.controller()).to.eventually.equal(chainA.helpers.chain.toErc7930(newGovernor));
  });
});
