const { balance, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const MultiPartyEscrow = artifacts.require('MultiPartyEscrow');

contract('MultiPartyEscrow', function (accounts) {
  const [ owner, party1] = [ accounts[0], accounts[9], accounts[8], accounts[7] ];
  const [ stranger1 ] = [ accounts[1] ];

  let contractInstance;

  beforeEach(async function () {
    contractInstance = await MultiPartyEscrow.new({ from: owner });
  });

  describe('when the multiparty escrow contract is created', async function () {
    it('should set owner the owner correctly', async () => {
      expect(await contractInstance.owner()).to.be.equal(owner);
    });

    it('should be able to send ether to it', async () => {
      const tracker = await balance.tracker(party1);
      const trackerContract = await balance.tracker(contractInstance.address);
      const receipt = await contractInstance.deposit({ from: party1, value: ether('3') });
      expectEvent(receipt, 'Deposited', {
        from: party1,
        weiAmount: ether('3'),
      });
      expect(await tracker.delta()).to.be.bignumber.lessThan(ether('-3'));
      expect(await trackerContract.delta()).to.be.bignumber.equal(ether('3'));
    });

    it('should return balance correctly', async () => {
      await contractInstance.deposit({ from: party1, value: ether('3') });
      expect(await contractInstance.depositsOf(party1)).to.be.bignumber.equal(ether('3'));
    });

    it('depositor should be able to withdraw funds', async () => {
      const tracker = await balance.tracker(party1);
      await contractInstance.deposit({ from: party1, value: ether('3') });
      const receipt = await contractInstance.withdraw(party1, ether('3'), { from: party1 });
      expectEvent(receipt, 'Withdrawn', {
        to: party1,
        weiAmount: ether('3'),
      });
      expect(await tracker.delta()).to.be.bignumber.greaterThan(ether('-0.1'));
    });

    it('owner should be able to withdraw funds', async () => {
      const tracker = await balance.tracker(owner);
      await contractInstance.deposit({ from: party1, value: ether('3') });
      const receipt = await contractInstance.withdraw(party1, ether('3'), { from: owner });
      expectEvent(receipt, 'Withdrawn', {
        to: owner,
        weiAmount: ether('3'),
      });
      expect(await tracker.delta()).to.be.bignumber.greaterThan(ether('2.95'));
    });

    it('should not be able to withdraw more than deposited funds', async () => {
      await contractInstance.deposit({ from: party1, value: ether('3') });
      await expectRevert(contractInstance.withdraw(party1, ether('4'), { from: party1 }), 'Insufficient balance');
    });

    it('people other than depositor, owner should NOT be able to withdraw funds', async () => {
      const tracker = await balance.tracker(contractInstance.address);
      await contractInstance.deposit({ from: party1, value: ether('3') });
      const errorMsg = 'Sender not authorized to receive funds';
      await expectRevert(contractInstance.withdraw(owner, ether('3'), { from: stranger1 }), errorMsg);
      expect(await tracker.delta()).to.be.bignumber.equal(ether('3'));
      expect(await contractInstance.depositsOf(party1)).to.be.bignumber.equal(ether('3'));
    });
  });
});
