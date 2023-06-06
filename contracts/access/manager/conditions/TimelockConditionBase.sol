// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../../utils/math/SafeCast.sol";
import "./ITimelockCondition.sol";

abstract contract TimelockConditionBase is ITimelockCondition {
    mapping(bytes32 id => Operation operation) private _operations;

    // Caller: whenever possible, this should use transient storage
    address private _currentCaller;

    function currentCaller() public view returns (address) {
        return _currentCaller;
    }

    function details(bytes32 id) public view virtual returns (Operation memory) {
        return _operations[id];
    }

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

    // Operations: Load cache, perform operation, then sync cache.
    struct OperationCache {
        bytes32   id;
        Operation op;
    }

    function _load(bytes32 id) internal view returns (OperationCache memory cache) {
        return OperationCache({ id: id, op: _operations[id] });
    }

    function _sync(OperationCache memory cache) internal {
        _operations[cache.id] = cache.op;
    }

    function _schedule(
        OperationCache memory   cache,
        address[]      calldata targets,
        uint256[]      calldata values,
        bytes[]        calldata payloads,
        bytes32                 salt,
        address                 caller,
        uint48                  duration
    ) internal {
        if (cache.op.state != OperationState.UNSET) {
            revert ProposalAlreadyExist(cache.id);
        }
        uint48 timepoint = SafeCast.toUint48(block.timestamp) + duration;
        cache.op = Operation({ state: OperationState.SCHEDULED, proposer: caller, timepoint: timepoint });
        emit Scheduled(cache.id, caller, targets, values, payloads, salt, timepoint);
    }

    function _execute(
        OperationCache memory   cache,
        address[]      calldata targets,
        uint256[]      calldata values,
        bytes[]        calldata payloads
    ) internal {
        if (cache.op.state != OperationState.SCHEDULED || cache.op.timepoint > block.timestamp) {
            revert ProposalNotReady(cache.id);
        }
        cache.op.state = OperationState.EXECUTED;

        // force sync before executing call
        _sync(cache);
        _performCall(cache.op.proposer, targets, values, payloads);

        emit Executed(cache.id);
    }

    function _cancel(OperationCache memory cache) internal {
        if (cache.op.state != OperationState.SCHEDULED) {
            revert ProposalNotActive(cache.id);
        }
        cache.op.state = OperationState.CANCELED;

        emit Cancelled(cache.id);
    }

    // Internal helpers
    function _performCall(
        address proposer,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads
    ) internal virtual {
        address oldCaller = _currentCaller;
        _currentCaller = proposer;
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, ) = targets[i].call{value: values[i]}(payloads[i]);
            require(success, "TimelockCondition: underlying transaction reverted");
        }
        _currentCaller = oldCaller;
    }
}