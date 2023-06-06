// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../../token/ERC721/utils/ERC721Holder.sol";
import "../../../token/ERC1155/utils/ERC1155Holder.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/Context.sol";
import "../AccessManaged.sol";
import "./TimelockConditionBase.sol";

contract TimelockConditionManaged is
    Context,
    TimelockConditionBase,
    AccessManagedImmutable,
    ERC721Holder,
    ERC1155Holder
{
    // Constructor
    constructor(IAuthority authority) AccessManagedImmutable(authority) {}

    // Methods
    receive() external payable {}

    function delay(
        address[] calldata targets,
        bytes[]   calldata payloads
    ) public view virtual override returns (uint48) {
        uint48 maxDelay = 0;
        for (uint256 i = 0; i < targets.length; ++i) {
            // Both argument of the Math.max operation are uint48, so the downcast is safe.
            maxDelay = uint48(Math.max(
                maxDelay,
                delay(targets[i], bytes4(payloads[i][0:4]))
            ));
        }
        return maxDelay;
    }

    function delay(address /*target*/, bytes4 /*selector*/) public view virtual returns (uint48) {
        return 1 minutes;
    }

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
}
