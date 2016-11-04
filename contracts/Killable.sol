pragma solidity ^0.4.0;
import "./Ownable.sol";

/*
 * Killable
 * Base contract that can be killed by owner
 */
contract Killable is Ownable {
  function kill() {
    if (msg.sender == owner) selfdestruct(owner);
  }
}
