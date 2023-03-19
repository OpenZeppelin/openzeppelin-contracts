const { expectEvent, expectRevert, time: { duration } } = require('@openzeppelin/test-helpers');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

const AccessManager = artifacts.require('$AccessManager');
const AccessManaged = artifacts.require('$AccessManaged');

const teamMask = team => 1n << BigInt(team);

contract('AccessManager', function ([admin, nonAdmin, user1]) {
  beforeEach('deploy', async function () {
    this.delay = duration.days(1);
    this.manager = await AccessManager.new(this.delay, admin);
    this.managed = await AccessManaged.new(this.manager.address);
  });

  it('configures default admin rules', async function () {
    expect(await this.manager.defaultAdmin()).to.equal(admin);
    expect(await this.manager.defaultAdminDelay()).to.be.bignumber.equal(this.delay);
  });

  describe('public team', function () {
    const publicTeam = '255';

    it('is created automatically', async function () {
      await expectEvent.inConstruction(this.manager, 'TeamUpdated', {
        team: publicTeam,
        name: 'public',
      });
    });

    it('includes all users automatically', async function () {
      const user1Teams = await this.manager.getUserTeams(user1);

      expect(BigInt(user1Teams) & teamMask(publicTeam)).to.not.equal(0n);
    });
  });

  describe('teams', function () {
    const team = '1';
    const name = 'dao';
    const otherTeam = '2';
    const otherName = 'council';

    it('can create teams', async function () {
      const created = await this.manager.createTeam(team, name, { from: admin });
      expectEvent(created, 'TeamUpdated', { team, name });
      expect(await this.manager.hasTeam(team)).to.equal(true);
      expect(await this.manager.hasTeam(otherTeam)).to.equal(false);
    });

    it('only admin can create teams', async function () {
      await expectRevert(
        this.manager.createTeam(team, name, { from: nonAdmin }),
        'missing role',
      );
    });

    it('can update team', async function () {
      await this.manager.createTeam(team, name, { from: admin });
      const updated = await this.manager.updateTeamName(team, otherName, { from: admin });
      expectEvent(updated, 'TeamUpdated', { team, name: otherName });
    });
  });
});
