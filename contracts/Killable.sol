pragma solidity ^0.4.4;
import "./Ownable.sol";

/*
 * Killable
 * Base contract that can be killed by owner
 */
contract Killable is Ownable {
  function kill() onlyOwner {
    selfdestruct(owner);
  }
}
