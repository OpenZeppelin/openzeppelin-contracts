// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../../utils/math/SafeCast.sol";
import "../../../utils/Context.sol";
import "../AccessManager.sol";
import "./TimelockConditionBase.sol";

contract TimelockConditionShared is
    Context,
    TimelockConditionBase
{
    // Constant delay
    uint48 public immutable _delay;

    // errors
    error UnauthorizedCaller(bytes32 id);
    error PrecheckFailed();

    // Store of operations details
    mapping(bytes32 id => Operation operation) private _operations;

    // Constructor
    constructor(uint48 duration) {
        _delay = duration;
    }

    // Methods
    function details(bytes32 id) public view virtual override returns (Operation memory) {
        return _operations[id];
    }

    function delay(
        address[] calldata /*targets*/,
        bytes[]   calldata /*payloads*/
    ) public view virtual override returns (uint48) {
        return _delay;
    }

    function schedule(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public virtual override returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.UNSET) {
            revert ProposalAlreadyExist(id);
        }
        address proposer = _msgSender();

        // Check that the proposer can call through this condition. This check does not support nested conditions.
        for (uint256 i = 0; i < targets.length; ++i) {
            address authority     = address(IManaged(targets[i]).authority());
            bytes32 allowedGroups = IAccessManager(authority).getFunctionAllowedGroups(targets[i], bytes4(payloads[i][0:4]));
            bytes32 userGroups    = IAccessManager(authority).getUserGroups(proposer, _toSingletonArray(address(this)));
            if (allowedGroups & userGroups == 0) {
                revert PrecheckFailed();
            }
        }

        uint48 timepoint = SafeCast.toUint48(block.timestamp) + delay(targets, payloads);
        op = Operation({ state: OperationState.SCHEDULED, proposer: proposer, timepoint: timepoint });

        // sync: memory (cache) → storage
        _operations[id] = op;

        emit Scheduled(id, proposer, targets, values, payloads, salt, timepoint);

        return id;
    }

    // Should this be restricted to the proposer ?
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public payable virtual override returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // De we need to check that _msgSender() is op.proposer ?
        if (
            op.state     != OperationState.SCHEDULED ||
            op.timepoint >  block.timestamp
        ) {
            revert ProposalNotReady(id);
        }
        if (op.proposer  != _msgSender()) {
            revert UnauthorizedCaller(id);
        }
        op.state = OperationState.EXECUTED;

        // sync: memory (cache) → storage
        _operations[id] = op;

        // external calls
        _execute(op.proposer, targets, values, payloads);
        emit Executed(id);

        return id;
    }

    function cancel(bytes32 id) public virtual override {
        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.SCHEDULED) {
            revert ProposalNotActive(id);
        }
        if (op.proposer != _msgSender()) {
            revert UnauthorizedCaller(id);
        }
        op.state = OperationState.CANCELED;

        // sync: memory (cache) → storage
        _operations[id] = op;

        emit Cancelled(id);
    }

    function _toSingletonArray(address entry) private pure returns (address[] memory) {
        address[] memory array = new address[](1);
        array[0] = entry;
        return array;
    }
}