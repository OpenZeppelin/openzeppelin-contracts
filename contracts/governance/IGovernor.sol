// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IGovernor {
    // events
    event Proposed(bytes32 indexed id, address[] target, uint256[] value, bytes[] data, bytes32 salt);
    event Executed(bytes32 indexed id);
    event Vote(bytes32 indexed id, address account, uint256 balance, uint8 support);

    // settings
    function votingOffset()            public view virtual returns (uint256);
    function votingDuration()          public view virtual returns (uint256);
    function quorum()                  public view virtual returns (uint256);
    function maxScore()                public view virtual returns (uint8);
    function requiredScore()           public view virtual returns (uint8);
    function getVotes(address,uint256) public view virtual returns (uint256);
}
