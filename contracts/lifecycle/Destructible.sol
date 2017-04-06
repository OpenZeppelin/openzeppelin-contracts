pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";


/*
 * Destructible
 * Base contract that can be destroyed by owner. All funds in contract will be sent to the owner.
 */
contract Destructible is Ownable {
  function destroy() onlyOwner {
    selfdestruct(owner);
  }
}
