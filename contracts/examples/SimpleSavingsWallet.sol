pragma solidity ^0.4.11;

import "../ownership/Inheritable.sol";


/**
 * @title SimpleSavingsWallet
 * @dev Simplest form of savings wallet that can be inherited if owner dies.
 * In this example, we take a very simple savings wallet providing two operations
 * (to send and receive funds) and extend its capabilities by making it Inheritable.
 * The account that creates the contract is set as owner, who has the authority to
 * choose an heir account. Heir account can reclaim the contract ownership in the
 * case that the owner dies.
 */
contract SimpleSavingsWallet is Inheritable {

  event Sent(address payee, uint amount, uint balance);
  event Received(address payer, uint amount, uint balance);


  function SimpleSavingsWallet(uint _heartbeatTimeout) Inheritable(_heartbeatTimeout) public {}
  
  /**
   * @dev wallet can receive funds.
   */
  function () public payable {
    Received(msg.sender, msg.value, this.balance);
  }

  /**
   * @dev wallet can send funds
   */
  function sendTo(address payee, uint amount) public onlyOwner {
    require(payee != 0 && payee != address(this));
    require(amount > 0);
    payee.transfer(amount);
    Sent(payee, amount, this.balance);
  }
}
