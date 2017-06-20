pragma solidity ^0.4.11;


/**
 * @title Shareable
 * @dev inheritable "property" contract that enables methods to be protected by requiring the 
 * acquiescence of either a single, or, crucially, each of a number of, designated owners.
 * @dev Usage: use modifiers onlyowner (just own owned) or onlymanyowners(hash), whereby the same hash must be provided by some number (specified in constructor) of the set of owners (specified in the constructor) before the interior is executed.
 */
contract Shareable {

  // struct for the status of a pending operation.
  struct PendingState {
    uint256 yetNeeded;
    uint256 ownersDone;
    uint256 index;
  }

  // the number of owners that must confirm the same operation before it is run.
  uint256 public required;

  // list of owners
  address[256] owners;
  // index on the list of owners to allow reverse lookup
  mapping(address => uint256) ownerIndex;
  // the ongoing operations.
  mapping(bytes32 => PendingState) pendings;
  bytes32[] pendingsIndex;


  // this contract only has six types of events: it can accept a confirmation, in which case
  // we record owner and operation (hash) alongside it.
  event Confirmation(address owner, bytes32 operation);
  event Revoke(address owner, bytes32 operation);


  // simple single-sig function modifier.
  modifier onlyOwner {
    if (!isOwner(msg.sender)) {
      throw;
    }
    _;
  }
  
  /** 
   * @dev Modifier for multisig functions. 
   * @param _operation The operation must have an intrinsic hash in order that later attempts can be
   * realised as the same underlying operation and thus count as confirmations.
   */
  modifier onlymanyowners(bytes32 _operation) {
    if (confirmAndCheck(_operation)) {
      _;
    }
  }

  /** 
   * @dev Constructor is given the number of sigs required to do protected "onlymanyowners" 
   * transactions as well as the selection of addresses capable of confirming them.
   * @param _owners A list of owners.
   * @param _required The amount required for a transaction to be approved.
   */
  function Shareable(address[] _owners, uint256 _required) {
    owners[1] = msg.sender;
    ownerIndex[msg.sender] = 1;
    for (uint256 i = 0; i < _owners.length; ++i) {
      owners[2 + i] = _owners[i];
      ownerIndex[_owners[i]] = 2 + i;
    }
    required = _required;
    if (required > owners.length) {
      throw;
    }
  }

  /**
   * @dev Revokes a prior confirmation of the given operation.
   * @param _operation A string identifying the operation.
   */
  function revoke(bytes32 _operation) external {
    uint256 index = ownerIndex[msg.sender];
    // make sure they're an owner
    if (index == 0) {
      return;
    }
    uint256 ownerIndexBit = 2**index;
    var pending = pendings[_operation];
    if (pending.ownersDone & ownerIndexBit > 0) {
      pending.yetNeeded++;
      pending.ownersDone -= ownerIndexBit;
      Revoke(msg.sender, _operation);
    }
  }

  /**
   * @dev Gets an owner by 0-indexed position (using numOwners as the count)
   * @param ownerIndex uint256 The index of the owner
   * @return The address of the owner
   */
  function getOwner(uint256 ownerIndex) external constant returns (address) {
    return address(owners[ownerIndex + 1]);
  }

  /**
   * @dev Checks if given address is an owner.
   * @param _addr address The address which you want to check.
   * @return True if the address is an owner and fase otherwise.
   */
  function isOwner(address _addr) constant returns (bool) {
    return ownerIndex[_addr] > 0;
  }

  /**
   * @dev Function to check is specific owner has already confirme the operation.
   * @param _operation The operation identifier.
   * @param _owner The owner address.
   * @return True if the owner has confirmed and false otherwise.
   */
  function hasConfirmed(bytes32 _operation, address _owner) constant returns (bool) {
    var pending = pendings[_operation];
    uint256 index = ownerIndex[_owner];

    // make sure they're an owner
    if (index == 0) {
      return false;
    }

    // determine the bit to set for this owner.
    uint256 ownerIndexBit = 2**index;
    return !(pending.ownersDone & ownerIndexBit == 0);
  }

  /**
   * @dev Confirm and operation and checks if it's already executable.
   * @param _operation The operation identifier.
   * @return Returns true when operation can be executed.
   */
  function confirmAndCheck(bytes32 _operation) internal returns (bool) {
    // determine what index the present sender is:
    uint256 index = ownerIndex[msg.sender];
    // make sure they're an owner
    if (index == 0) {
      throw;
    }

    var pending = pendings[_operation];
    // if we're not yet working on this operation, switch over and reset the confirmation status.
    if (pending.yetNeeded == 0) {
      // reset count of confirmations needed.
      pending.yetNeeded = required;
      // reset which owners have confirmed (none) - set our bitmap to 0.
      pending.ownersDone = 0;
      pending.index = pendingsIndex.length++;
      pendingsIndex[pending.index] = _operation;
    }
    // determine the bit to set for this owner.
    uint256 ownerIndexBit = 2**index;
    // make sure we (the message sender) haven't confirmed this operation previously.
    if (pending.ownersDone & ownerIndexBit == 0) {
      Confirmation(msg.sender, _operation);
      // ok - check if count is enough to go ahead.
      if (pending.yetNeeded <= 1) {
        // enough confirmations: reset and run interior.
        delete pendingsIndex[pendings[_operation].index];
        delete pendings[_operation];
        return true;
      } else {
        // not enough: record that this owner in particular confirmed.
        pending.yetNeeded--;
        pending.ownersDone |= ownerIndexBit;
      }
    }
    return false;
  }


  /**
   * @dev Clear the pending list.
   */
  function clearPending() internal {
    uint256 length = pendingsIndex.length;
    for (uint256 i = 0; i < length; ++i) {
      if (pendingsIndex[i] != 0) {
        delete pendings[pendingsIndex[i]];
      }
    }
    delete pendingsIndex;
  }

}
