pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";


/**
 * @title Destructible
 * @dev Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 */
contract Destructible is Ownable {

  /**
   *@dev The destroy function transfer the current balance to the owner and terminate de lifecycle
   */
  function destroy() onlyOwner {
    selfdestruct(owner);
  }

  function destroyAndSend(address _recipient) onlyOwner {
    selfdestruct(_recipient);
  }
}
