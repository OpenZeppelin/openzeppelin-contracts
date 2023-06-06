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
        bytes32 id       = hashOperation(targets, values, payloads, salt);
        address caller   = _msgSender();
        uint48  duration = delay(targets, payloads);

        // Check that the proposer can call through this condition. This check does not support nested conditions.
        for (uint256 i = 0; i < targets.length; ++i) {
            address authority     = address(IManaged(targets[i]).authority());
            bytes32 allowedGroups = IAccessManager(authority).getFunctionAllowedGroups(targets[i], bytes4(payloads[i][0:4]));
            bytes32 userGroups    = IAccessManager(authority).getUserGroups(caller, _toSingletonArray(address(this)));
            if (allowedGroups & userGroups == 0) {
                revert PrecheckFailed();
            }
        }

        // Operations:
        // - load cache
        // - schedule
        // - sync
        OperationCache memory cache = _load(id);
        _schedule(cache, targets, values, payloads, salt, caller, duration);
        _sync(cache);

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

        // Operations:
        // - load cache
        // - execute
        // - (sync is implicit in execute)
        OperationCache memory cache = _load(id);
        _execute(cache, targets, values, payloads);

        if (cache.op.proposer != _msgSender()) revert UnauthorizedCaller(id);

        return id;
    }

    function cancel(bytes32 id) public virtual override {
        // Operations:
        // - load cache
        // - perform check
        // - cancel
        // - sync
        OperationCache memory cache = _load(id);
        _cancel(cache);
        _sync(cache);

        if (cache.op.proposer != _msgSender()) revert UnauthorizedCaller(id);
    }

    function _toSingletonArray(address entry) private pure returns (address[] memory) {
        address[] memory array = new address[](1);
        array[0] = entry;
        return array;
    }
}