// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../ICondition.sol";

abstract contract TimelockConditionBase is ICondition {
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

    // Caller: whenever possible, this should use transient storage
    address private _currentCaller;

    /// @dev See {ICondition}. Value is set in {execute} before the relaying.
    function currentCaller() public view returns (address) {
        return _currentCaller;
    }

    // Functions
    function hashOperation(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    ) public pure returns (bytes32) {
        if (targets.length != values.length || targets.length != payloads.length) {
            revert InvalidArgumentLength();
        }
        return keccak256(abi.encode(targets, values, payloads, salt));
    }

    // Interface
    function details(bytes32 id) external view virtual returns (Operation memory);

    function delay(
        address[] calldata targets,
        bytes[]   calldata payloads
    ) public view virtual returns (uint48);

    function schedule(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    ) external virtual returns (bytes32);

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    ) external payable virtual returns (bytes32);

    function cancel(bytes32 id) external virtual;

    // Helper
    function _execute(
        address proposer,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads
    ) internal {
        address oldCaller = _currentCaller;
        _currentCaller = proposer;
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, ) = targets[i].call{value: values[i]}(payloads[i]);
            require(success, "TimelockCondition: underlying transaction reverted");
        }
        _currentCaller = oldCaller;
    }
}
