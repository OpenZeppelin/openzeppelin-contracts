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
    // Store of operations details
    mapping(bytes32 id => Operation operation) private _operations;

    // Constructor
    constructor(IAuthority authority) AccessManagedImmutable(authority) {}

    // Methods
    receive() external payable {}

    function details(bytes32 id) public view virtual override returns (Operation memory) {
        return _operations[id];
    }

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
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.UNSET) {
            revert ProposalAlreadyExist(id);
        }
        address proposer = _msgSender();
        uint48 timepoint = SafeCast.toUint48(block.timestamp) + delay(targets, payloads);
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
    public payable virtual override restricted() returns (bytes32)
    {
        bytes32 id = hashOperation(targets, values, payloads, salt);

        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state == OperationState.SCHEDULED && op.timepoint <= block.timestamp) {
            op.state = OperationState.EXECUTED;
        } else if (op.state == OperationState.UNSET && authority.canCall(_msgSender(), address(this), this.schedule.selector) && delay(targets, payloads) == 0) {
            address caller = _msgSender();
            uint48 timepoint = SafeCast.toUint48(block.timestamp);
            op = Operation({ state: OperationState.EXECUTED, proposer: caller, timepoint: timepoint });
            emit Scheduled(id, caller, targets, values, payloads, salt, timepoint);
        } else {
            revert ProposalNotReady(id);
        }

        // sync: memory (cache) → storage
        _operations[id] = op;

        // external calls
        _execute(op.proposer, targets, values, payloads);
        emit Executed(id);

        return id;
    }

    function cancel(bytes32 id) public virtual override restricted() {
        // fetch: storage → memory (cache)
        Operation memory op = _operations[id];

        // operate on the cache
        if (op.state != OperationState.SCHEDULED) {
            revert ProposalNotActive(id);
        }
        op.state = OperationState.CANCELED;

        // sync: memory (cache) → storage
        _operations[id] = op;

        emit Cancelled(id);
    }
}
