// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (vendor/polygon/IFxMessageProcessor.sol)
pragma solidity ^0.8.0;

interface IFxMessageProcessor {
    function processMessageFromRoot(uint256 stateId, address rootMessageSender, bytes calldata data) external;
}
