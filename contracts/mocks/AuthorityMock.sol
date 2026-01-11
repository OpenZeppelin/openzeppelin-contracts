// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManaged} from "../access/manager/IAccessManaged.sol";
import {IAuthority} from "../access/manager/IAuthority.sol";

contract NotAuthorityMock is IAuthority {
    function canCall(address /* caller */, address /* target */, bytes4 /* selector */) external pure returns (bool) {
        revert("NotAuthorityMock: not implemented");
    }
}

contract AuthorityNoDelayMock is IAuthority {
    bool private _immediate;

    function canCall(
        address /* caller */,
        address /* target */,
        bytes4 /* selector */
    ) external view returns (bool immediate) {
        return _immediate;
    }

    function _setImmediate(bool immediate) external {
        _immediate = immediate;
    }
}

contract AuthorityDelayMock {
    bool private _immediate;
    uint32 private _delay;

    function canCall(
        address /* caller */,
        address /* target */,
        bytes4 /* selector */
    ) external view returns (bool immediate, uint32 delay) {
        return (_immediate, _delay);
    }

    function _setImmediate(bool immediate) external {
        _immediate = immediate;
    }

    function _setDelay(uint32 delay) external {
        _delay = delay;
    }
}

contract AuthorityNoResponse {
    // This mock intentionally returns no data from canCall.
    // It is used to test robustness when an authority does not
    // respond with the expected return values.
    function canCall(address /* caller */, address /* target */, bytes4 /* selector */) external view {}
}

contract AuthorityObserveIsConsuming {
    event ConsumeScheduledOpCalled(address caller, bytes data, bytes4 isConsuming);

    function canCall(
        address /* caller */,
        address /* target */,
        bytes4 /* selector */
    ) external pure returns (bool immediate, uint32 delay) {
        return (false, 1);
    }

    function consumeScheduledOp(address caller, bytes memory data) public {
        emit ConsumeScheduledOpCalled(caller, data, IAccessManaged(msg.sender).isConsumingScheduledOp());
    }
}
