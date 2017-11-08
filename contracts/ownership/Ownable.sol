pragma solidity ^0.4.11;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;
  address public transferOwnershipAddress;

  event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * Note that current owner still have control until new owner accept the transfer
   * with call of takeOwnership() to complete the operation.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) onlyOwner public {
    require(newOwner != address(0));
    OwnershipTransferStarted(owner, newOwner);
    transferOwnershipAddress = newOwner;
  }

  /**
   * @dev Allows the new owner to take the control of the contract.
   */
  function takeOwnership() public {
    require(transferOwnershipAddress != address(0));
    require(msg.sender == transferOwnershipAddress);
    OwnershipTransferred(owner, transferOwnershipAddress);
    owner = transferOwnershipAddress;
    transferOwnershipAddress = address(0);
  }

}
