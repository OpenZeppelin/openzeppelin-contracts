pragma solidity ^0.4.24;

import "./Escrow.sol";


/**
 * @title PullPayment
 * @dev Base contract supporting async send for pull payments. Inherit from this
 * contract and use asyncSend instead of send or transfer.
 */
contract PullPayment {
  Escrow public escrow;

  constructor() public {
    escrow = new Escrow();
  }

  /**
  * @dev Called by the payer to store the sent amount as credit to be pulled.
  * @param dest The destination address of the funds.
  * @param amount The amount to transfer.
  */
  function asyncSend(address dest, uint256 amount) internal {
    escrow.deposit.value(amount)(dest);
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
  & @param dest The creditor's address.
  */
  function payments(address dest) public view returns (uint256) {
    return escrow.deposits(dest);
  }
}
