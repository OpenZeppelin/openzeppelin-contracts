pragma solidity ^0.4.24;

import "../ownership/Heritable.sol";


/**
 * @title SimpleSavingsWallet
 * @dev Simplest form of savings wallet whose ownership can be claimed by a heir
 * if owner dies.
 * In this example, we take a very simple savings wallet providing two operations
 * (to send and receive funds) and extend its capabilities by making it Heritable.
 * The account that creates the contract is set as owner, who has the authority to
 * choose an heir account. Heir account can reclaim the contract ownership in the
 * case that the owner dies.
 */
contract SimpleSavingsWallet is Heritable {

  event Sent(address indexed payee, uint256 amount, uint256 balance);
  event Received(address indexed payer, uint256 amount, uint256 balance);


  constructor(uint256 _heartbeatTimeout) Heritable(_heartbeatTimeout) public {}

  /**
   * @dev wallet can receive funds.
   */
  function () public payable {
    emit Received(msg.sender, msg.value, address(this).balance);
  }

  /**
   * @dev wallet can send funds
   */
  function sendTo(address payee, uint256 amount) public onlyOwner {
    require(payee != address(0) && payee != address(this));
    require(amount > 0);
    payee.transfer(amount);
    emit Sent(payee, amount, address(this).balance);
  }
}
