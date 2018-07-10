pragma solidity ^0.4.24;

/**
 * @title AutoIncrementing
 * @author Matt Condon (@shrugs)
 * @dev Provides an auto-incrementing uint256 id acquired by the `nextId(bytes32 _key)` getter.
 * Use this for issuing ERC721Token ids or keeping track of request ids, anything you want, really.
 * @notice Does not allow an Id of 0, which is popularly used to signify a null state in solidity.
 * @notice Does not protect from overflows, but if you have 2^256 ids, you have other problems.
 */
contract AutoIncrementing {

  bytes32 internal constant DEFAULT_COUNTER = keccak256("default");

  // Maps from key() to nextId
  mapping(bytes32 => uint256) private nextIds_;

  function nextId(bytes32 _key) internal returns (uint256) {
    uint256 thisId = nextIds_[_key];
    if (thisId == 0) {
      // not initialized, default to 1
      thisId = 1;
    }
    nextIds_[_key] = thisId + 1;
    return thisId;
  }
}
