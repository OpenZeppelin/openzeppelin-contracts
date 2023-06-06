// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../ICondition.sol";

interface ITimelockCondition is ICondition {
    enum OperationState {
        UNSET,
        SCHEDULED,
        EXECUTED,
        CANCELED
    }

    // The entire `Operation` structure fits into one single slot. Whenever operating on one of these structures in
    // storage, the pattern is to:
    // - load the structure from storage to memory
    // - operate on the memory object
    // - write the memory object back to storage
    // This enshures only one sload and one sstore are necessary. Using this pattern, the value in storage is not valid
    // during the operation. It is important that the operation content does not exist (risk of reentrancy) or rely on
    // internal functions that read from storage.
    struct Operation {
        OperationState state;
        address proposer;
        uint48 timepoint;
    }

    // Events
    event Scheduled(
        bytes32   id,
        address   proposer,
        address[] targets,
        uint256[] values,
        bytes[]   payloads,
        bytes32   salt,
        uint48    timepoint
    );
    event Executed(bytes32 id);
    event Cancelled(bytes32 id);

    // Errors
    error InvalidArgumentLength();
    error ProposalAlreadyExist(bytes32);
    error ProposalNotActive(bytes32);
    error ProposalNotReady(bytes32);

    // Functions
    function hashOperation(address[] calldata, uint256[] calldata, bytes[] calldata, bytes32) external view returns (bytes32);
    function details(bytes32 id) external view returns (Operation memory);
    function delay(address[] calldata, bytes[] calldata) external view returns (uint48);
    function schedule(address[] calldata, uint256[] calldata, bytes[] calldata, bytes32) external returns (bytes32);
    function execute(address[] calldata, uint256[] calldata, bytes[] calldata, bytes32) external payable returns (bytes32);
    function cancel(bytes32 id) external;
}
