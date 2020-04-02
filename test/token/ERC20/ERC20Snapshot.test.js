const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ERC20SnapshotMock = contract.fromArtifact('ERC20SnapshotMock');

const { expect } = require('chai');

describe('ERC20Snapshot', function () {
  const [ initialHolder, recipient, other ] = accounts;

  const initialSupply = new BN(100);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.token = await ERC20SnapshotMock.new(name, symbol, initialHolder, initialSupply);
  });

  describe('snapshot', function () {
    it('emits a snapshot event', async function () {
      const { logs } = await this.token.snapshot();
      expectEvent.inLogs(logs, 'Snapshot');
    });

    it('creates increasing snapshots ids, starting from 1', async function () {
      for (const id of ['1', '2', '3', '4', '5']) {
        const { logs } = await this.token.snapshot();
        expectEvent.inLogs(logs, 'Snapshot', { id });
      }
    });
  });

  describe('totalSupplyAt', function () {
    it('reverts with a snapshot id of 0', async function () {
      await expectRevert(this.token.totalSupplyAt(0), 'ERC20Snapshot: id is 0');
    });

    it('reverts with a not-yet-created snapshot id', async function () {
      await expectRevert(this.token.totalSupplyAt(1), 'ERC20Snapshot: nonexistent id');
    });

    context('with initial snapshot', function () {
      beforeEach(async function () {
        this.initialSnapshotId = new BN('1');

        const { logs } = await this.token.snapshot();
        expectEvent.inLogs(logs, 'Snapshot', { id: this.initialSnapshotId });
      });

      context('with no supply changes after the snapshot', function () {
        it('returns the current total supply', async function () {
          expect(await this.token.totalSupplyAt(this.initialSnapshotId)).to.be.bignumber.equal(initialSupply);
        });
      });

      context('with supply changes after the snapshot', function () {
        beforeEach(async function () {
          await this.token.mint(other, new BN('50'));
          await this.token.burn(initialHolder, new BN('20'));
        });

        it('returns the total supply before the changes', async function () {
          expect(await this.token.totalSupplyAt(this.initialSnapshotId)).to.be.bignumber.equal(initialSupply);
        });

        context('with a second snapshot after supply changes', function () {
          beforeEach(async function () {
            this.secondSnapshotId = new BN('2');

            const { logs } = await this.token.snapshot();
            expectEvent.inLogs(logs, 'Snapshot', { id: this.secondSnapshotId });
          });

          it('snapshots return the supply before and after the changes', async function () {
            expect(await this.token.totalSupplyAt(this.initialSnapshotId)).to.be.bignumber.equal(initialSupply);

            expect(await this.token.totalSupplyAt(this.secondSnapshotId)).to.be.bignumber.equal(
              await this.token.totalSupply()
            );
          });
        });

        context('with multiple snapshots after supply changes', function () {
          beforeEach(async function () {
            this.secondSnapshotIds = ['2', '3', '4'];

            for (const id of this.secondSnapshotIds) {
              const { logs } = await this.token.snapshot();
              expectEvent.inLogs(logs, 'Snapshot', { id });
            }
          });

          it('all posterior snapshots return the supply after the changes', async function () {
            expect(await this.token.totalSupplyAt(this.initialSnapshotId)).to.be.bignumber.equal(initialSupply);

            const currentSupply = await this.token.totalSupply();

            for (const id of this.secondSnapshotIds) {
              expect(await this.token.totalSupplyAt(id)).to.be.bignumber.equal(currentSupply);
            }
          });
        });
      });
    });
  });

  describe('balanceOfAt', function () {
    it('reverts with a snapshot id of 0', async function () {
      await expectRevert(this.token.balanceOfAt(other, 0), 'ERC20Snapshot: id is 0');
    });

    it('reverts with a not-yet-created snapshot id', async function () {
      await expectRevert(this.token.balanceOfAt(other, 1), 'ERC20Snapshot: nonexistent id');
    });

    context('with initial snapshot', function () {
      beforeEach(async function () {
        this.initialSnapshotId = new BN('1');

        const { logs } = await this.token.snapshot();
        expectEvent.inLogs(logs, 'Snapshot', { id: this.initialSnapshotId });
      });

      context('with no balance changes after the snapshot', function () {
        it('returns the current balance for all accounts', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId))
            .to.be.bignumber.equal(initialSupply);
          expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId)).to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(other, this.initialSnapshotId)).to.be.bignumber.equal('0');
        });
      });

      context('with balance changes after the snapshot', function () {
        beforeEach(async function () {
          await this.token.transfer(recipient, new BN('10'), { from: initialHolder });
          await this.token.mint(recipient, new BN('50'));
          await this.token.burn(initialHolder, new BN('20'));
        });

        it('returns the balances before the changes', async function () {
          expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId))
            .to.be.bignumber.equal(initialSupply);
          expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId)).to.be.bignumber.equal('0');
          expect(await this.token.balanceOfAt(other, this.initialSnapshotId)).to.be.bignumber.equal('0');
        });

        context('with a second snapshot after supply changes', function () {
          beforeEach(async function () {
            this.secondSnapshotId = new BN('2');

            const { logs } = await this.token.snapshot();
            expectEvent.inLogs(logs, 'Snapshot', { id: this.secondSnapshotId });
          });

          it('snapshots return the balances before and after the changes', async function () {
            expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId))
              .to.be.bignumber.equal(initialSupply);
            expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOfAt(other, this.initialSnapshotId)).to.be.bignumber.equal('0');

            expect(await this.token.balanceOfAt(initialHolder, this.secondSnapshotId)).to.be.bignumber.equal(
              await this.token.balanceOf(initialHolder)
            );
            expect(await this.token.balanceOfAt(recipient, this.secondSnapshotId)).to.be.bignumber.equal(
              await this.token.balanceOf(recipient)
            );
            expect(await this.token.balanceOfAt(other, this.secondSnapshotId)).to.be.bignumber.equal(
              await this.token.balanceOf(other)
            );
          });
        });

        context('with multiple snapshots after supply changes', function () {
          beforeEach(async function () {
            this.secondSnapshotIds = ['2', '3', '4'];

            for (const id of this.secondSnapshotIds) {
              const { logs } = await this.token.snapshot();
              expectEvent.inLogs(logs, 'Snapshot', { id });
            }
          });

          it('all posterior snapshots return the supply after the changes', async function () {
            expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId))
              .to.be.bignumber.equal(initialSupply);
            expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId)).to.be.bignumber.equal('0');
            expect(await this.token.balanceOfAt(other, this.initialSnapshotId)).to.be.bignumber.equal('0');

            for (const id of this.secondSnapshotIds) {
              expect(await this.token.balanceOfAt(initialHolder, id)).to.be.bignumber.equal(
                await this.token.balanceOf(initialHolder)
              );
              expect(await this.token.balanceOfAt(recipient, id)).to.be.bignumber.equal(
                await this.token.balanceOf(recipient)
              );
              expect(await this.token.balanceOfAt(other, id)).to.be.bignumber.equal(
                await this.token.balanceOf(other)
              );
            }
          });
        });
      });
    });
  });
});
