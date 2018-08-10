pragma solidity ^0.4.24;

import "./Escrow.sol";


/**
 * @title PullPayment
 * @dev Base contract supporting async send for pull payments. Inherit from this
 * contract and use asyncTransfer instead of send or transfer.
 */
contract PullPayment {
  Escrow private escrow;

  constructor() public {
    escrow = new Escrow();
  }

  /**
  * @dev Withdraw accumulated balance, called by payee.
  */
  function withdrawPayments() public {
    address payee = msg.sender;
    escrow.withdraw(payee);
  }

  /**
  * @dev Returns the credit owed to an address.
  * @param _dest The creditor's address.
  */
  function payments(address _dest) public view returns (uint256) {
    return escrow.depositsOf(_dest);
  }

  /**
  * @dev Called by the payer to store the sent amount as credit to be pulled.
  * @param _dest The destination address of the funds.
  * @param _amount The amount to transfer.
  */
  function asyncTransfer(address _dest, uint256 _amount) internal {
    escrow.deposit.value(_amount)(_dest);
  }
}
