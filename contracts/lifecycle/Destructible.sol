pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";


/*
 * Destructible
 * Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 * In second function all funds will be sent to the recepient.
 */
contract Destructible is Ownable {
  function destroy() onlyOwner {
    selfdestruct(owner);
  }

  function destroyAndSendRecepient(address _recipient) onlyOwner {
    selfdestruct(_recipient);
  }
}
