pragma solidity ^0.4.24;

/**
 * @title AutoIncrementing
 * @author Matt Condon (@shrugs)
 * @dev Provides an auto-incrementing uint256 id acquired by the `nextId` getter.
 * Use this for issuing ERC721Token Ids or keeping track of request ids, anything you want, really.
 * @notice Does not allow an Id of 0, which is popularly used to signify a null state in solidity.
 */
contract AutoIncrementing {
  uint256 private nextId_ = 1;

  function nextId() internal returns (uint256) {
    uint256 thisId = nextId_;
    nextId_ = nextId_ + 1;
    return thisId;
  }
}
