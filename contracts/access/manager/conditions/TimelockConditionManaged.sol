// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../../token/ERC721/utils/ERC721Holder.sol";
import "../../../token/ERC1155/utils/ERC1155Holder.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/Context.sol";
import "../AccessManaged.sol";
import "./TimelockConditionBase.sol";


library Optionals {
    error TooLarge();
    error None();

    type ouint47 is uint48;

    function some(uint48 value) internal pure returns (ouint47) {
        if (value >> 47 > 0) revert TooLarge();
        return ouint47.wrap(1 << 47 | value);
    }

    function none() internal pure returns (ouint47) {
        return ouint47.wrap(0);
    }

    function isSome(ouint47 o) internal pure returns (bool) {
        return ouint47.unwrap(o) >> 47 > 0;
    }

    function tryGet(ouint47 o) internal pure returns (bool, uint48) {
        return (isSome(o), _get(o));
    }

    function get(ouint47 o) internal pure returns (uint48) {
        if (!isSome(o)) revert None();
        return _get(o);
    }

    function _get(ouint47 o) private pure returns (uint48) {
        return ouint47.unwrap(o) & ~uint48(1 << 47);
    }
}




contract TimelockConditionManaged is
    Context,
    TimelockConditionBase,
    AccessManagedImmutable,
    ERC721Holder,
    ERC1155Holder
{
    mapping(address => mapping(bytes4 => Optionals.ouint47)) private _customDelay;
    uint48 private _defaultDelay;


    // Constructor
    constructor(IAuthority authority, uint48 initialDelay)
        AccessManagedImmutable(authority)
    {
        _defaultDelay = initialDelay;
    }

    // Methods
    receive() external payable {}

    function schedule(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public virtual override restricted() returns (bytes32)
    {
        bytes32 id       = hashOperation(targets, values, payloads, salt);
        address caller   = _msgSender();
        uint48  duration = delay(targets, payloads);

        // Operations:
        // - load cache
        // - schedule
        // - sync
        OperationCache memory cache = _load(id);
        _schedule(cache, targets, values, payloads, salt, caller, duration);
        _sync(cache);

        return id;
    }

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[]   calldata payloads,
        bytes32            salt
    )
    public payable virtual override restricted() returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // Operations:
        // - load cache
        // - schedule if necessary (and if operation can be executed without delay)
        // - execute
        // - (sync is implicit in execute)
        OperationCache memory cache = _load(id);
        if (
            cache.op.state == OperationState.UNSET &&
            authority.canCall(_msgSender(), address(this), this.schedule.selector) &&
            delay(targets, payloads) == 0
        ) {
            _schedule(cache, targets, values, payloads, salt, _msgSender(), 0);
        }
        _execute(cache, targets, values, payloads);

        return id;
    }

    function cancel(bytes32 id) public virtual override restricted() {
        // Operations:
        // - load cache
        // - cancel
        // - sync
        OperationCache memory cache = _load(id);
        _cancel(cache);
        _sync(cache);
    }

    // delay management
    function delay(
        address[] calldata targets,
        bytes[]   calldata payloads
    ) public view virtual override returns (uint48) {
        uint48 defaultDelay = getDefaultDelay();
        uint48 maxDelay = 0;
        for (uint256 i = 0; i < targets.length; ++i) {
            // Both argument of the Math.max operation are uint48, so the downcast is safe.
            (bool enabled, uint48 value) = getCustomDelay(targets[i], bytes4(payloads[i][0:4]));
            maxDelay = uint48(Math.max(maxDelay, enabled ? value : defaultDelay));
        }
        return maxDelay;
    }

    function getDefaultDelay() public view virtual returns (uint48) {
        return _defaultDelay;
    }

    function setDefaultDelay(uint48 value) public virtual restricted() {
        _defaultDelay = value;
    }

    function getCustomDelay(address target, bytes4 selector) public view virtual returns (bool, uint48) {
        return Optionals.tryGet(_customDelay[target][selector]);
    }

    function setCustomDelay(address target, bytes4 selector, uint48 value) public virtual restricted() {
        _customDelay[target][selector] = Optionals.some(value);
    }

    function deleteCustomDelay(address target, bytes4 selector) public virtual restricted() {
        _customDelay[target][selector] = Optionals.none();
    }
}
