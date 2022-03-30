// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFxMessageProcessor {
    function processMessageFromRoot(
        uint256 stateId,
        address rootMessageSender,
        bytes calldata data
    ) external;
}
