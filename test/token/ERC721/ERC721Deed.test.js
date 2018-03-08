import assertRevert from '../../helpers/assertRevert';
const BigNumber = web3.BigNumber;
const ERC721Deed = artifacts.require('ERC721DeedMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Deed', accounts => {
  let deed = null;
  const _firstDeedId = 1;
  const _secondDeedId = 2;
  const _unknownDeedId = 3;
  const _creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    deed = await ERC721Deed.new({ from: _creator });
    await deed.mint(_creator, _firstDeedId, { from: _creator });
    await deed.mint(_creator, _secondDeedId, { from: _creator });
  });

  describe('countOfDeeds', function () {
    it('has a number of deeds equivalent to the inital supply', async function () {
      const countOfDeeds = await deed.countOfDeeds();
      countOfDeeds.should.be.bignumber.equal(2);
    });
  });

  describe('countOfDeedsByOwner', function () {
    describe('when the given address owns some deeds', function () {
      it('returns the amount of deeds owned by the given address', async function () {
        const balance = await deed.countOfDeedsByOwner(_creator);
        balance.should.be.bignumber.equal(2);
      });
    });

    describe('when the given address does not own any deeds', function () {
      it('returns 0', async function () {
        const balance = await deed.countOfDeedsByOwner(accounts[1]);
        balance.should.be.bignumber.equal(0);
      });
    });
  });

  describe('ownerOf', function () {
    describe('when the given deed ID was tracked by this deed', function () {
      const deedId = _firstDeedId;

      it('returns the owner of the given deed ID', async function () {
        const owner = await deed.ownerOf(deedId);
        owner.should.be.equal(_creator);
      });
    });

    describe('when the given deed ID was not tracked by this deed', function () {
      const deedId = _unknownDeedId;

      it('reverts', async function () {
        await assertRevert(deed.ownerOf(deedId));
      });
    });
  });

  describe('mint', function () {
    describe('when the given deed ID was not tracked by this contract', function () {
      const deedId = _unknownDeedId;

      describe('when the given address is not the zero address', function () {
        const to = accounts[1];

        it('mints the given deed ID to the given address', async function () {
          const previousBalance = await deed.countOfDeedsByOwner(to);

          await deed.mint(to, deedId);

          const owner = await deed.ownerOf(deedId);
          owner.should.be.equal(to);

          const balance = await deed.countOfDeedsByOwner(to);
          balance.should.be.bignumber.equal(previousBalance + 1);
        });

        it('adds that deed to the deed list of the owner', async function () {
          await deed.mint(to, deedId);

          const deeds = await deed.deedsOf(to);
          deeds.length.should.be.equal(1);
          deeds[0].should.be.bignumber.equal(deedId);
        });

        it('emits a transfer event', async function () {
          const { logs } = await deed.mint(to, deedId);

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Transfer');
          console.log('tttest', logs[0].args);
          logs[0].args._from.should.be.equal(ZERO_ADDRESS);
          logs[0].args._to.should.be.equal(to);
          logs[0].args._deedId.should.be.bignumber.equal(deedId);
        });
      });

      describe('when the given address is the zero address', function () {
        const to = ZERO_ADDRESS;

        it('reverts', async function () {
          await assertRevert(deed.mint(to, deedId));
        });
      });
    });

    describe('when the given deed ID was already tracked by this contract', function () {
      const deedId = _firstDeedId;

      it('reverts', async function () {
        await assertRevert(deed.mint(accounts[1], deedId));
      });
    });
  });

  describe('burn', function () {
    describe('when the given deed ID was tracked by this contract', function () {
      const deedId = _firstDeedId;

      describe('when the msg.sender owns given deed', function () {
        const sender = _creator;

        it('burns the given deed ID and adjusts the balance of the owner', async function () {
          const previousBalance = await deed.countOfDeedsByOwner(sender);

          await deed.burn(deedId, { from: sender });

          await assertRevert(deed.ownerOf(deedId));
          const balance = await deed.countOfDeedsByOwner(sender);
          balance.should.be.bignumber.equal(previousBalance - 1);
        });

        it('removes that deed from the deed list of the owner', async function () {
          await deed.burn(deedId, { from: sender });

          const deeds = await deed.deedsOf(sender);
          deeds.length.should.be.equal(1);
          deeds[0].should.be.bignumber.equal(_secondDeedId);
        });

        it('emits a burn event', async function () {
          const { logs } = await deed.burn(deedId, { from: sender });

          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Transfer');
          logs[0].args._from.should.be.equal(sender);
          logs[0].args._to.should.be.equal(ZERO_ADDRESS);
          logs[0].args._deedId.should.be.bignumber.equal(deedId);
        });

        describe('when there is an approval for the given deed ID', function () {
          beforeEach(async function () {
            await deed.approve(accounts[1], deedId, { from: sender });
          });

          it('clears the approval', async function () {
            await deed.burn(deedId, { from: sender });
            const approvedAccount = await deed.approvedFor(deedId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits an approval event', async function () {
            const { logs } = await deed.burn(deedId, { from: sender });

            logs.length.should.be.equal(2);

            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._deedId.should.be.bignumber.equal(deedId);
          });
        });
      });

      describe('when the msg.sender does not own given deed', function () {
        const sender = accounts[1];

        it('reverts', async function () {
          await assertRevert(deed.burn(deedId, { from: sender }));
        });
      });
    });

    describe('when the given deed ID was not tracked by this contract', function () {
      const deedID = _unknownDeedId;

      it('reverts', async function () {
        await assertRevert(deed.burn(deedID, { from: _creator }));
      });
    });
  });

  describe('transfer', function () {
    describe('when the address to transfer the deed to is not the zero address', function () {
      const to = accounts[1];

      describe('when the given deed ID was tracked by this deed', function () {
        const deedId = _firstDeedId;

        describe('when the msg.sender is the owner of the given deed ID', function () {
          const sender = _creator;

          it('transfers the ownership of the given deed ID to the given address', async function () {
            await deed.transfer(to, deedId, { from: sender });

            const newOwner = await deed.ownerOf(deedId);
            newOwner.should.be.equal(to);
          });

          it('clears the approval for the deed ID', async function () {
            await deed.approve(accounts[2], deedId, { from: sender });

            await deed.transfer(to, deedId, { from: sender });

            const approvedAccount = await deed.approvedFor(deedId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits an approval and transfer events', async function () {
            const { logs } = await deed.transfer(to, deedId, { from: sender });

            logs.length.should.be.equal(2);

            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._deedId.should.be.bignumber.equal(deedId);

            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.equal(sender);
            logs[1].args._to.should.be.equal(to);
            logs[1].args._deedId.should.be.bignumber.equal(deedId);
          });

          it('adjusts owners balances', async function () {
            const previousBalance = await deed.countOfDeedsByOwner(sender);
            await deed.transfer(to, deedId, { from: sender });

            const newOwnerBalance = await deed.countOfDeedsByOwner(to);
            newOwnerBalance.should.be.bignumber.equal(1);

            const previousOwnerBalance = await deed.countOfDeedsByOwner(_creator);
            previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
          });

          it('adds the deed to the deeds list of the new owner', async function () {
            await deed.transfer(to, deedId, { from: sender });

            const deedIDs = await deed.deedsOf(to);
            deedIDs.length.should.be.equal(1);
            deedIDs[0].should.be.bignumber.equal(deedId);
          });
        });

        describe('when the msg.sender is not the owner of the given deed ID', function () {
          const sender = accounts[2];

          it('reverts', async function () {
            await assertRevert(deed.transfer(to, deedId, { from: sender }));
          });
        });
      });

      describe('when the given deed ID was not tracked by this deed', function () {
        let deedId = _unknownDeedId;

        it('reverts', async function () {
          await assertRevert(deed.transfer(to, deedId, { from: _creator }));
        });
      });
    });

    describe('when the address to transfer the deed to is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(deed.transfer(to, 0, { from: _creator }));
      });
    });
  });

  describe('approve', function () {
    describe('when the given deed ID was already tracked by this contract', function () {
      const deedId = _firstDeedId;

      describe('when the sender owns the given deed ID', function () {
        const sender = _creator;

        describe('when the address that receives the approval is the 0 address', function () {
          const to = ZERO_ADDRESS;

          describe('when there was no approval for the given deed ID before', function () {
            it('clears the approval for that deed', async function () {
              await deed.approve(to, deedId, { from: sender });

              const approvedAccount = await deed.approvedFor(deedId);
              approvedAccount.should.be.equal(to);
            });

            it('does not emit an approval event', async function () {
              const { logs } = await deed.approve(to, deedId, { from: sender });

              logs.length.should.be.equal(0);
            });
          });

          describe('when the given deed ID was approved for another account', function () {
            beforeEach(async function () {
              await deed.approve(accounts[2], deedId, { from: sender });
            });

            it('clears the approval for the deed ID', async function () {
              await deed.approve(to, deedId, { from: sender });

              const approvedAccount = await deed.approvedFor(deedId);
              approvedAccount.should.be.equal(to);
            });

            it('emits an approval event', async function () {
              const { logs } = await deed.approve(to, deedId, { from: sender });

              logs.length.should.be.equal(1);
              logs[0].event.should.be.eq('Approval');
              logs[0].args._owner.should.be.equal(sender);
              logs[0].args._approved.should.be.equal(to);
              logs[0].args._deedId.should.be.bignumber.equal(deedId);
            });
          });
        });

        describe('when the address that receives the approval is not the 0 address', function () {
          describe('when the address that receives the approval is different than the owner', function () {
            const to = accounts[1];

            describe('when there was no approval for the given deed ID before', function () {
              it('approves the deed ID to the given address', async function () {
                await deed.approve(to, deedId, { from: sender });

                const approvedAccount = await deed.approvedFor(deedId);
                approvedAccount.should.be.equal(to);
              });

              it('emits an approval event', async function () {
                const { logs } = await deed.approve(to, deedId, { from: sender });

                logs.length.should.be.equal(1);
                logs[0].event.should.be.eq('Approval');
                logs[0].args._owner.should.be.equal(sender);
                logs[0].args._approved.should.be.equal(to);
                logs[0].args._deedId.should.be.bignumber.equal(deedId);
              });
            });

            describe('when the given deed ID was approved for the same account', function () {
              beforeEach(async function () {
                await deed.approve(to, deedId, { from: sender });
              });

              it('keeps the approval to the given address', async function () {
                await deed.approve(to, deedId, { from: sender });

                const approvedAccount = await deed.approvedFor(deedId);
                approvedAccount.should.be.equal(to);
              });

              it('emits an approval event', async function () {
                const { logs } = await deed.approve(to, deedId, { from: sender });

                logs.length.should.be.equal(1);
                logs[0].event.should.be.eq('Approval');
                logs[0].args._owner.should.be.equal(sender);
                logs[0].args._approved.should.be.equal(to);
                logs[0].args._deedId.should.be.bignumber.equal(deedId);
              });
            });

            describe('when the given deed ID was approved for another account', function () {
              beforeEach(async function () {
                await deed.approve(accounts[2], deedId, { from: sender });
              });

              it('changes the approval to the given address', async function () {
                await deed.approve(to, deedId, { from: sender });

                const approvedAccount = await deed.approvedFor(deedId);
                approvedAccount.should.be.equal(to);
              });

              it('emits an approval event', async function () {
                const { logs } = await deed.approve(to, deedId, { from: sender });

                logs.length.should.be.equal(1);
                logs[0].event.should.be.eq('Approval');
                logs[0].args._owner.should.be.equal(sender);
                logs[0].args._approved.should.be.equal(to);
                logs[0].args._deedId.should.be.bignumber.equal(deedId);
              });
            });
          });

          describe('when the address that receives the approval is the owner', function () {
            const to = _creator;

            describe('when there was no approval for the given deed ID before', function () {
              it('reverts', async function () {
                await assertRevert(deed.approve(to, deedId, { from: sender }));
              });
            });

            describe('when the given deed ID was approved for another account', function () {
              beforeEach(async function () {
                await deed.approve(accounts[2], deedId, { from: sender });
              });

              it('reverts', async function () {
                await assertRevert(deed.approve(to, deedId, { from: sender }));
              });
            });
          });
        });
      });

      describe('when the sender does not own the given deed ID', function () {
        const sender = accounts[1];

        it('reverts', async function () {
          await assertRevert(deed.approve(accounts[2], deedId, { from: sender }));
        });
      });
    });

    describe('when the given deed ID was not tracked by the contract before', function () {
      const deedId = _unknownDeedId;

      it('reverts', async function () {
        await assertRevert(deed.approve(accounts[1], deedId, { from: _creator }));
      });
    });
  });

  describe('takeOwnership', function () {
    describe('when the given deed ID was already tracked by this contract', function () {
      const deedId = _firstDeedId;

      describe('when the sender has the approval for the deed ID', function () {
        const sender = accounts[1];

        beforeEach(async function () {
          await deed.approve(sender, deedId, { from: _creator });
        });

        it('transfers the ownership of the given deed ID to the given address', async function () {
          await deed.takeOwnership(deedId, { from: sender });

          const newOwner = await deed.ownerOf(deedId);
          newOwner.should.be.equal(sender);
        });

        it('clears the approval for the deed ID', async function () {
          await deed.takeOwnership(deedId, { from: sender });

          const approvedAccount = await deed.approvedFor(deedId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        it('emits an approval and transfer events', async function () {
          const { logs } = await deed.takeOwnership(deedId, { from: sender });

          logs.length.should.be.equal(2);

          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(_creator);
          logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
          logs[0].args._deedId.should.be.bignumber.equal(deedId);

          logs[1].event.should.be.eq('Transfer');
          logs[1].args._from.should.be.equal(_creator);
          logs[1].args._to.should.be.equal(sender);
          logs[1].args._deedId.should.be.bignumber.equal(deedId);
        });

        it('adjusts owners balances', async function () {
          const previousBalance = await deed.countOfDeedsByOwner(_creator);

          await deed.takeOwnership(deedId, { from: sender });

          const newOwnerBalance = await deed.countOfDeedsByOwner(sender);
          newOwnerBalance.should.be.bignumber.equal(1);

          const previousOwnerBalance = await deed.countOfDeedsByOwner(_creator);
          previousOwnerBalance.should.be.bignumber.equal(previousBalance - 1);
        });

        it('adds the deed to the deeds list of the new owner', async function () {
          await deed.takeOwnership(deedId, { from: sender });

          const deedIDs = await deed.deedsOf(sender);
          deedIDs.length.should.be.equal(1);
          deedIDs[0].should.be.bignumber.equal(deedId);
        });
      });

      describe('when the sender does not have an approval for the deed ID', function () {
        const sender = accounts[1];

        it('reverts', async function () {
          await assertRevert(deed.takeOwnership(deedId, { from: sender }));
        });
      });

      describe('when the sender is already the owner of the deed', function () {
        const sender = _creator;

        it('reverts', async function () {
          await assertRevert(deed.takeOwnership(deedId, { from: sender }));
        });
      });
    });

    describe('when the given deed ID was not tracked by the contract before', function () {
      const deedId = _unknownDeedId;

      it('reverts', async function () {
        await assertRevert(deed.takeOwnership(deedId, { from: _creator }));
      });
    });
  });
});
