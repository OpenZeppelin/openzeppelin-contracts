pragma solidity ^0.4.24;

import "../utils/CloneFactory.sol";
import "./ERC20Mock.sol";

/**
 * @title Simple ERC20 Clone Contract Factory
 * 
 * @dev This code (intended to be called from an implementor factory contract)
 * will allow you to install a master copy of the ERC20 contract, then easily
 * (cheaply) create clones with separate state. The deployed bytecode just 
 * delegates all calls to the master contract address.
 *
 * 1) Be sure that the master contract is pre-initialized.
 * 2) Do not allow your master contract to be self-destructed as it will cause
 *    all clones to stop working
 */
contract ERC20CloneFactory is CloneFactory {

  address public masterAddress;

  event CloneCreated(address cloneAddress);

  constructor(address _masterAddress) public {
    masterAddress = _masterAddress;
  }

  function createNew(uint256 amount) public returns (address) {
    address cloneAddress = createClone(masterAddress);
    emit CloneCreated(cloneAddress);
    ERC20Mock(cloneAddress).mint(msg.sender, amount);
  }
}
