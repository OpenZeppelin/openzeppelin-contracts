// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC20.sol";

interface IERC20Votes is IERC20 {
    struct Checkpoint {
        uint32  fromBlock;
        uint224 votes;
    }

    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    // function nonces(address owner) external view returns (uint256);
    function delegates(address owner) external view returns (address);
    function checkpoints(address account, uint32 pos) external view returns (Checkpoint memory);
    function numCheckpoints(address account) external view returns (uint32);
    function getCurrentVotes(address account) external view returns (uint256);
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256);
    function delegate(address delegatee) external;
    function delegateFromBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) external;
}
