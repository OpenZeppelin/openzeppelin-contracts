pragma solidity ^0.4.23;


contract AutoIncrementing {
  uint256 private nextId_ = 0;

  function nextId() internal returns (uint256) {
    uint256 thisId = nextId_;
    nextId_ = nextId_ + 1;
    return thisId;
  }
}
