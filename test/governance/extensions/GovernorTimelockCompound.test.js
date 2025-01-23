const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { GovernorHelper } = require('../../helpers/governance');
const { ProposalState, VoteType } = require('../../helpers/enums');
const time = require('../../helpers/time');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');
const defaultDelay = time.duration.days(2n);

describe('GovernorTimelockCompound', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [deployer, owner, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const predictGovernor = await deployer
        .getNonce()
        .then(nonce => ethers.getCreateAddress({ from: deployer.address, nonce: nonce + 1 }));
      const timelock = await ethers.deployContract('CompTimelock', [predictGovernor, defaultDelay]);
      const mock = await ethers.deployContract('$GovernorTimelockCompoundMock', [
        name,
        votingDelay,
        votingPeriod,
        0n,
        timelock,
        token,
        0n,
      ]);

      await owner.sendTransaction({ to: timelock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { deployer, owner, voter1, voter2, voter3, voter4, other, receiver, token, mock, timelock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        // default proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              value,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          '<proposal description>',
        );
      });

      it("doesn't accept ether transfers", async function () {
        await expect(this.owner.sendTransaction({ to: this.mock, value: 1n })).to.be.revertedWithCustomError(
          this.mock,
          'GovernorDisabledDeposit',
        );
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0n)).to.equal(0n);

        expect(await this.mock.timelock()).to.equal(this.timelock);
        expect(await this.timelock.admin()).to.equal(this.mock);
      });

      it('nominal', async function () {
        expect(await this.mock.proposalEta(this.proposal.id)).to.equal(0n);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.true;

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter4).vote({ support: VoteType.Abstain });
        await this.helper.waitForDeadline();
        const txQueue = await this.helper.queue();

        const eta = (await time.clockFromReceipt.timestamp(txQueue)) + defaultDelay;
        expect(await this.mock.proposalEta(this.proposal.id)).to.equal(eta);
        expect(await this.mock.proposalNeedsQueuing(this.proposal.id)).to.be.true;

        await this.helper.waitForEta();
        const txExecute = await this.helper.execute();

        await expect(txQueue)
          .to.emit(this.mock, 'ProposalQueued')
          .withArgs(this.proposal.id, eta)
          .to.emit(this.timelock, 'QueueTransaction')
          .withArgs(...Array(5).fill(anyValue), eta);

        await expect(txExecute)
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.proposal.id)
          .to.emit(this.timelock, 'ExecuteTransaction')
          .withArgs(...Array(5).fill(anyValue), eta)
          .to.emit(this.receiver, 'MockFunctionCalled');
      });

      describe('should revert', function () {
        describe('on queue', function () {
          it('if already queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await expect(this.helper.queue())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Queued,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded]),
              );
          });

          it('if proposal contains duplicate calls', async function () {
            const action = {
              target: this.token.target,
              data: this.token.interface.encodeFunctionData('approve', [this.receiver.target, ethers.MaxUint256]),
            };
            const { id } = this.helper.setProposal([action, action], '<proposal description>');

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await expect(this.helper.queue())
              .to.be.revertedWithCustomError(this.mock, 'GovernorAlreadyQueuedProposal')
              .withArgs(id);
            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorNotQueuedProposal')
              .withArgs(id);
          });
        });

        describe('on execute', function () {
          it('if not queued', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline(1n);

            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Succeeded);

            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorNotQueuedProposal')
              .withArgs(this.proposal.id);
          });

          it('if too early', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();

            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Queued);

            await expect(this.helper.execute()).to.be.rejectedWith(
              "Timelock::executeTransaction: Transaction hasn't surpassed time lock",
            );
          });

          it('if too late', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta(time.duration.days(30));

            expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Expired);

            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Expired,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });

          it('if already executed', async function () {
            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();
            await this.helper.execute();

            await expect(this.helper.execute())
              .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
              .withArgs(
                this.proposal.id,
                ProposalState.Executed,
                GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
              );
          });
        });

        describe('on safe receive', function () {
          describe('ERC721', function () {
            const tokenId = 1n;

            beforeEach(async function () {
              this.token = await ethers.deployContract('$ERC721', ['Non Fungible Token', 'NFT']);
              await this.token.$_mint(this.owner, tokenId);
            });

            it("can't receive an ERC721 safeTransfer", async function () {
              await expect(
                this.token.connect(this.owner).safeTransferFrom(this.owner, this.mock, tokenId),
              ).to.be.revertedWithCustomError(this.mock, 'GovernorDisabledDeposit');
            });
          });

          describe('ERC1155', function () {
            const tokenIds = {
              1: 1000n,
              2: 2000n,
              3: 3000n,
            };

            beforeEach(async function () {
              this.token = await ethers.deployContract('$ERC1155', ['https://token-cdn-domain/{id}.json']);
              await this.token.$_mintBatch(this.owner, Object.keys(tokenIds), Object.values(tokenIds), '0x');
            });

            it("can't receive ERC1155 safeTransfer", async function () {
              await expect(
                this.token.connect(this.owner).safeTransferFrom(
                  this.owner,
                  this.mock,
                  ...Object.entries(tokenIds)[0], // id + amount
                  '0x',
                ),
              ).to.be.revertedWithCustomError(this.mock, 'GovernorDisabledDeposit');
            });

            it("can't receive ERC1155 safeBatchTransfer", async function () {
              await expect(
                this.token
                  .connect(this.owner)
                  .safeBatchTransferFrom(this.owner, this.mock, Object.keys(tokenIds), Object.values(tokenIds), '0x'),
              ).to.be.revertedWithCustomError(this.mock, 'GovernorDisabledDeposit');
            });
          });
        });
      });

      describe('cancel', function () {
        it('cancel before queue prevents scheduling', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);

          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Canceled);

          await expect(this.helper.queue())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded]),
            );
        });

        it('cancel after queue prevents executing', async function () {
          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.queue();

          await expect(this.helper.cancel('internal'))
            .to.emit(this.mock, 'ProposalCanceled')
            .withArgs(this.proposal.id);

          expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Canceled);

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
            .withArgs(
              this.proposal.id,
              ProposalState.Canceled,
              GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
            );
        });
      });

      describe('onlyGovernance', function () {
        describe('relay', function () {
          beforeEach(async function () {
            await this.token.$_mint(this.mock, 1);
          });

          it('is protected', async function () {
            await expect(
              this.mock
                .connect(this.owner)
                .relay(this.token, 0, this.token.interface.encodeFunctionData('transfer', [this.other.address, 1n])),
            )
              .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
              .withArgs(this.owner);
          });

          it('can be executed through governance', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.mock.target,
                  data: this.mock.interface.encodeFunctionData('relay', [
                    this.token.target,
                    0n,
                    this.token.interface.encodeFunctionData('transfer', [this.other.address, 1n]),
                  ]),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();

            const txExecute = this.helper.execute();

            await expect(txExecute).to.changeTokenBalances(this.token, [this.mock, this.other], [-1n, 1n]);

            await expect(txExecute).to.emit(this.token, 'Transfer').withArgs(this.mock, this.other, 1n);
          });
        });

        describe('updateTimelock', function () {
          beforeEach(async function () {
            this.newTimelock = await ethers.deployContract('CompTimelock', [this.mock, time.duration.days(7n)]);
          });

          it('is protected', async function () {
            await expect(this.mock.connect(this.owner).updateTimelock(this.newTimelock))
              .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
              .withArgs(this.owner);
          });

          it('can be executed through governance to', async function () {
            this.helper.setProposal(
              [
                {
                  target: this.timelock.target,
                  data: this.timelock.interface.encodeFunctionData('setPendingAdmin', [this.owner.address]),
                },
                {
                  target: this.mock.target,
                  data: this.mock.interface.encodeFunctionData('updateTimelock', [this.newTimelock.target]),
                },
              ],
              '<proposal description>',
            );

            await this.helper.propose();
            await this.helper.waitForSnapshot();
            await this.helper.connect(this.voter1).vote({ support: VoteType.For });
            await this.helper.waitForDeadline();
            await this.helper.queue();
            await this.helper.waitForEta();

            await expect(this.helper.execute())
              .to.emit(this.mock, 'TimelockChange')
              .withArgs(this.timelock, this.newTimelock);

            expect(await this.mock.timelock()).to.equal(this.newTimelock);
          });
        });

        it('can transfer timelock to new governor', async function () {
          const newGovernor = await ethers.deployContract('$GovernorTimelockCompoundMock', [
            name,
            8n,
            32n,
            0n,
            this.timelock,
            this.token,
            0n,
          ]);

          this.helper.setProposal(
            [
              {
                target: this.timelock.target,
                data: this.timelock.interface.encodeFunctionData('setPendingAdmin', [newGovernor.target]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();
          await this.helper.queue();
          await this.helper.waitForEta();

          await expect(this.helper.execute()).to.emit(this.timelock, 'NewPendingAdmin').withArgs(newGovernor);

          await newGovernor.__acceptAdmin();
          expect(await this.timelock.admin()).to.equal(newGovernor);
        });
      });
    });
  }
});
