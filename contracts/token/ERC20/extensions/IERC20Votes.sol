// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC20.sol";

/**
 * @dev Extension of the ERC20 token contract to support Compound's voting and delegation.
 *
 * _Available since v4.2._
 */
interface IERC20Votes is IERC20 {
    struct Checkpoint {
        uint32  fromBlock;
        uint224 votes;
    }

    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    function delegates(address owner) external view returns (address);
    function checkpoints(address account, uint32 pos) external view returns (Checkpoint memory);
    function numCheckpoints(address account) external view returns (uint32);

    // Comp - returns uint96
    // function getCurrentVotes(address account) external view returns (uint96);
    // function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96);

    // OZ - returns uint256
    function getVotes(address account) external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns(uint256);

    function delegate(address delegatee) external;
    function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) external;
}
