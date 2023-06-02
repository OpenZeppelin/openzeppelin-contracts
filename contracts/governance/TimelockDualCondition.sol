// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../access/manager/AccessManaged.sol";
import "../access/manager/ICondition.sol";
import "../token/ERC721/utils/ERC721Holder.sol";
import "../token/ERC1155/utils/ERC1155Holder.sol";
import "../utils/math/Math.sol";
import "../utils/math/SafeCast.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";

contract TimelockDualCondition is
    Context,
    AccessManagedImmutable,
    ERC721Holder,
    ERC1155Holder,
    ICondition
{
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

    // Store of operations details
    mapping(bytes32 id => Operation operation) private _operations;

    // Whenever possible, this should use transient storage
    address private _currentCaller;

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
    error ProposalAlreadyExist();
    error ProposalNotActive();
    error ProposalNotReady();

    // Methods
    constructor(IAuthority authority) AccessManagedImmutable(authority) {}

    receive() external payable {}

    function currentCaller() public view returns (address) {
        return _currentCaller;
    }

    function details(bytes32 id) public view returns (Operation memory) {
        return _operations[id];
    }

    function delay(address /*target*/, bytes4 /*selector*/) public view virtual returns (uint48) {
        return 1 minutes;
    }

    // This produces the same hash as the governor (for now)
    function hashOperation(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 salt
    ) public pure virtual returns (bytes32) {
        if (targets.length != values.length || targets.length != payloads.length) {
            revert InvalidArgumentLength();
        }
        return keccak256(abi.encode(targets, values, payloads, salt));
    }

    function schedule(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public virtual restricted() returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.UNSET) revert ProposalAlreadyExist();
        address proposer = _msgSender();
        uint48 timepoint = SafeCast.toUint48(block.timestamp) + _delayForMultipleCalls(targets, payloads);
        op = Operation({ state: OperationState.SCHEDULED, proposer: proposer, timepoint: timepoint });

        // sync: memory (cache) → storage
        _operations[id] = op;

        emit Scheduled(id, proposer, targets, values, payloads, salt, timepoint);

        return id;
    }

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public payable virtual restricted() returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state == OperationState.SCHEDULED && op.timepoint <= block.timestamp) {
            op.state = OperationState.EXECUTED;
        } else if (op.state == OperationState.UNSET && authority.canCall(_msgSender(), address(this), this.schedule.selector) && _delayForMultipleCalls(targets, payloads) == 0) {
            address caller = _msgSender();
            uint48 timepoint = SafeCast.toUint48(block.timestamp);
            op = Operation({ state: OperationState.EXECUTED, proposer: caller, timepoint: timepoint });
            emit Scheduled(id, caller, targets, values, payloads, salt, timepoint);
        } else {
            revert ProposalNotReady();
        }

        // sync: memory (cache) → storage
        _operations[id] = op;

        // external calls
        address oldCaller = _currentCaller;
        _currentCaller = op.proposer;
        for (uint256 i = 0; i < targets.length; ++i) {
            Address.functionCallWithValue(targets[i], payloads[i], values[i]);
        }
        _currentCaller = oldCaller;

        emit Executed(id);

        return id;
    }

    function cancel(bytes32 id) public virtual restricted() {
        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.SCHEDULED) revert ProposalNotActive();
        op.state = OperationState.CANCELED;

        // sync: memory (cache) → storage
        _operations[id] = op;

        emit Cancelled(id);
    }

    function _delayForMultipleCalls(address[] calldata targets, bytes[] calldata payloads) private view returns (uint48) {
        uint48 maxDelay = 0;
        for (uint256 i = 0; i < targets.length; ++i) {
            // Both argument of the Math.max operation are uint48, so the downcast is safe.
            maxDelay = uint48(Math.max(maxDelay, delay(targets[i], bytes4(payloads[i][0:4]))));
        }
        return maxDelay;
    }
}
