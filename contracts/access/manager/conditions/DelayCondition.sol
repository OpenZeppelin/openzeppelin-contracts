// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../ICondition.sol";
import "../AccessManager.sol";
import "../../../utils/Address.sol";
import "../../../utils/math/SafeCast.sol";

contract DelayCondition is ICondition {
    address private _caller = address(0xdead);

    mapping(address =>                                      uint48)   private _delayTarget;
    mapping(address => mapping(address =>                   uint48))  private _delayCaller;
    mapping(address => mapping(address => mapping(bytes4 => uint48))) private _delaySelector;
    mapping(bytes32 id => uint48 timepoint) private _schedule;

    /// @dev Restrict function using a specific authority
    modifier restricted(IAuthority authority) {
        _checkCanCall(authority, msg.sender, msg.sig);
        _;
    }

    function _checkCanCall(IAuthority authority, address caller, bytes4 selector) internal view virtual {
        require(authority.canCall(caller, address(this), selector), "AccessManaged: authority rejected");
    }

    /// @dev See {ICondition}. Value is set in {execute} before the relaying.
    function currentCaller() public view returns (address) {
        return _caller;
    }

    /**
     * @dev Check that call are safe. Condition should only call external IManaged contracts, or the `setDelayXxx`
     * function on address(this).
     */
    modifier onlyValidCall(address target, bytes calldata call) {
        bytes4 selector = bytes4(call[0:4]);
        require(
            target != address(this)
            || selector == this.setDelayTarget.selector
            || selector == this.setDelayCaller.selector
            || selector == this.setDelaySelector.selector,
            "TimelockCondition: call not supported"
        );
        _;
    }

    /// @dev Schedule an operation to be executed on target.
    /// Target should either be a IManaged contract, or address(this)
    function schedule(address target, bytes calldata call) public onlyValidCall(target, call) {
        address caller = msg.sender;
        bytes4 selector = bytes4(call[0:4]);

        // if the call is a self call to `setDelayXxx`, get the real target from the call data
        address realTarget    = target == address(this) ? address(bytes20(call[0x10:0x24])) : target;
        address authority     = address(IManaged(realTarget).authority());
        bytes32 allowedGroups = IAccessManager(authority).getFunctionAllowedGroups(target, selector);
        bytes32 userGroups    = IAccessManager(authority).getUserGroups(caller, _toSingletonArray(address(this)));
        require(allowedGroups & userGroups != 0, "(somethingSchedule: unauthorized call");

        // schedule
        bytes32 id = keccak256(abi.encode(target, caller, call));
        _schedule[id] = SafeCast.toUint48(block.timestamp) + getDelay(realTarget, caller, selector);

        // todo emit event
    }

    function execute(address target, bytes calldata call) public onlyValidCall(target, call) {
        address caller = msg.sender;
        bytes4 selector = bytes4(call[0:4]);

        bytes32 id = keccak256(abi.encode(target, caller, call));
        uint48  timepoint = _schedule[id];

        // if not scheduled ...
        if (timepoint == 0 || timepoint > block.timestamp) {
            // ... delay must be 0
            address realTarget = target == address(this) ? address(bytes20(call[0x10:0x24])) : target;
            require(getDelay(realTarget, caller, selector) == 0, "Execute: not ready");
        } else {
            // reset to avoid re-execution without a delay
            delete _schedule[id];
        }

        // execute
        address callerBefore = _caller;
        _caller = msg.sender;
        Address.functionCall(target, call);
        _caller = callerBefore;

        // todo emit event
    }

    // ==================================================== DELAY =====================================================
    function getDelay(address target, address caller, bytes4 selector) public view returns (uint48) {
        uint48 value = _delaySelector[target][caller][selector];
        if (value == 0) value = _delayCaller[target][caller];
        if (value == 0) value = _delayTarget[target];
        return value;
    }

    function setDelayTarget(address target, uint48 delay) public restricted(IManaged(target).authority()) {
        _delayTarget[target] = delay;
    }

    function setDelayCaller(address target, address user, uint48 delay) public restricted(IManaged(target).authority()) {
        _delayCaller[target][user] = delay;
    }

    function setDelaySelector(address target, address user, bytes4 selector, uint48 delay) public restricted(IManaged(target).authority()) {
        _delaySelector[target][user][selector] = delay;
    }

    function _toSingletonArray(address entry) private pure returns (address[] memory) {
        address[] memory array = new address[](1);
        array[0] = entry;
        return array;
    }

}