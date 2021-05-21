const { expectRevert, time } = require('@openzeppelin/test-helpers');

async function getReceiptOrReason (promise, reason = undefined) {
  if (reason) {
    await expectRevert(promise, reason);
    return undefined;
  } else {
    const { receipt } = await promise;
    return receipt;
  }
}

function runGovernorWorkflow () {
  beforeEach(async () => {
    this.receipts = {};
    this.id = await this.governance.hashProposal(...this.settings.proposal.slice(0, -1));
  });

  it('run', async () => {
    // transfer tokens
    if (this.settings?.voters) {
      for (const voter of this.settings.voters) {
        await this.token.transfer(voter.address, voter.weight, { from: this.settings.tokenHolder });
      }
    }

    // propose
    if (this.settings?.steps?.propose?.enable != false) {
      this.receipts.propose = await getReceiptOrReason(
        this.governance.propose(...this.settings.proposal),
        this.settings?.steps?.propose?.reason,
      );
    }

    // vote
    if (this.settings?.voters) {
      this.receipts.castVote = [];
      for (const voter of this.settings.voters) {
        if (!voter.signature) {
          this.receipts.castVote.push(
            await getReceiptOrReason(
              this.governance.castVote(this.id, voter.support, { from: voter.address }),
              voter.reason,
            ),
          );
        } else {
          const { signature, v, r, s } = await voter.signature({ proposalId: this.id, support: voter.support });
          this.receipts.castVote.push(
            await getReceiptOrReason(
              this.governance.castVoteBySig(this.id, voter.support, v, r, s),
              voter.reason,
            ),
          );
        }
      }
    }

    // fast forward
    ({ deadline: this.deadline } = await this.governance.viewProposal(this.id));
    if (this.settings?.steps?.wait?.enable != false) {
      await time.increaseTo(this.deadline.addn(1));
    }

    // execute
    if (this.settings?.steps?.execute?.enable != false) {
      this.receipts.execute = await getReceiptOrReason(
        this.governance.execute(...this.settings.proposal.slice(0, -1)),
        this.settings?.steps?.execute?.reason,
      );
    }
  });

  afterEach(async () => {
    this.settings.after && await this.settings.after();
  });
}

module.exports = {
  runGovernorWorkflow,
};
