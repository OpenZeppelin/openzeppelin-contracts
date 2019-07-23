const Ticket721 = artifacts.require('Ticket721');
const { BN, expectRevert, expectEvent, time } = require('openzeppelin-test-helpers');

const { expect } = require('chai');

contract('Ticket721', accounts => {
  const [ownerAccount, account1, account2] = accounts;
  let ticket721;

  beforeEach(async () => {
    ticket721 = await Ticket721.new();
    await ticket721.issueTicket(account1, 1001/* ticketId */, { from: ownerAccount });
    await ticket721.issueTicket(account1, 1002/* ticketId */, { from: ownerAccount });
    await ticket721.issueTicket(account1, 1003/* ticketId */, { from: ownerAccount });
  });

  it('should NOT allow to issue a ticket if already issued', async () => {
    const ticketId = new BN('2002');
    // Issue the first time
    ticket721.issueTicket(account1, ticketId, { from: ownerAccount });
    await expectRevert(
      ticket721.issueTicket(account2, ticketId, { from: ownerAccount }),
      'Ticket needs to be not issued yet',
    );
  });

  it('should set an minter', async () => {
    expect(await ticket721.isMinter.call(ownerAccount)).to.equal(true);
    expect(await ticket721.isMinter.call(account1)).to.equal(false);
  });

  it('should allow minter to issue a ticket', async () => {
    expect(await ticket721.isConsumable(2001), false);
    await ticket721.issueTicket(account1, 2001/* ticketId */, { from: ownerAccount });
    expect(await ticket721.isConsumable(2001), true);
  });

  it('should NOT allow a non-minter to issue a ticket', async () => {
    expect(await ticket721.isConsumable(2001)).to.equal(false);
    await expectRevert(
      ticket721.issueTicket(account1, 2001/* ticketId */, { from: account1 }),
      'Only minter can issue ticket.',
      'This method should revert',
    );
  });

  it('should allow ticket holder to transfer a ticket.', async () => {
    expect(await ticket721.isConsumable(1001)).to.equal(true);
    await ticket721.transferFrom(account1, account2, 1001, { from: account1 });
    expect(await ticket721.isConsumable(1001)).to.equal(true);
    await ticket721.transferFrom(account2, account1, 1001, { from: account2 });
  });

  it('should allow ticket holder consume a ticket.', async () => {
    const ticketId = new BN('1002');
    expect(await ticket721.isConsumable(ticketId)).to.equal(true);
    const { logs } = await ticket721.consume(ticketId, { from: account1 });
    expect(await ticket721.isConsumable(1002)).to.equal(false);
    expectEvent.inLogs(logs, 'OnConsumption', {
      assetId: ticketId,
    });
  });

  it('should NOT allow non holder of a ticket to consume a ticket.', async () => {
    expect(await ticket721.isConsumable(1002), true);
    await expectRevert(
      ticket721.consume(1002, { from: account2 }),
      'Ticket should be held by tx sender to be consumed.',
      'This method should revert',
    );
  });

  it('should disallow a ticket not issued to be consumed.', async () => {
    expect(await ticket721.isConsumable(3001)).to.equal(false);
    await expectRevert(
      ticket721.consume(3001, { from: account2 }),
      'Ticket needs to be consumable.',
      'This method should revert',
    );
  });

  it('should allow ticket holder to transfer the ticket to anothor new holder and consume by that new holder.',
    async () => {
      const ticketId = new BN('1003');
      expect(await ticket721.isConsumable(ticketId)).to.equal(true, 'Step 1. Ticket is still consumable.');
      await ticket721.transferFrom(account1, account2, ticketId, { from: account1 });
      expect(await ticket721.isConsumable(ticketId)).to.equal(true, 'Step 2. Ticket is still consumable.');
      await expectRevert(
        ticket721.consume(ticketId, { from: account1 }), // account1 now no longer held ticketId=1003
        'Ticket should be held by tx sender to be consumed.',
        'This method should revert',
      );
      expect(await ticket721.isConsumable(ticketId)).to.equal(true, 'Step 3. Ticket is still consumable.');

      const { logs } = await ticket721.consume(ticketId, { from: account2 });
      expectEvent.inLogs(logs, 'OnConsumption', {
        assetId: ticketId,
      });

      expect(await ticket721.isConsumable(ticketId)).to.equal(
        false, 'Step 4. Now ticket is consumed, should no longer be consumable.');
    });
});
