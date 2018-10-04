pragma solidity ^0.4.24;

import "../utils/CloneFactory.sol";
import "../examples/SimpleToken.sol";

/**
 * @title Simple Clone Contract Factory
 * 
 * @dev This code (intended to be called from an implementor factory contract)
 * will allow you to install a master copy of the SimpleToken contract, then easily
 * (cheaply) create clones with separate state. The deployed bytecode just
 * delegates all calls to the master contract address.
 *
 * 1) Be sure that the master contract is pre-initialized.
 * 2) Do not allow your master contract to be self-destructed as it will cause
 *    all clones to stop working
 */
contract SimpleCloneFactory is CloneFactory {

  address public originAddress;

  constructor() public {
    originAddress = new SimpleToken();
  }

  function createNew() public returns (bool) {
    createClone(originAddress);
    return true;
  }
}
