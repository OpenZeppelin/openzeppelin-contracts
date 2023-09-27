// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAuthority} from "../access/manager/IAuthority.sol";

contract NotAuthorityMock is IAuthority {
    function canCall(address /* caller */, address /* target */, bytes4 /* selector */) external pure returns (bool) {
        revert("AuthorityNoDelayMock: not implemented");
    }
}

contract AuthorityNoDelayMock is IAuthority {
    bool _immediate;

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
    bool _immediate;
    uint32 _delay;

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
    function canCall(address /* caller */, address /* target */, bytes4 /* selector */) external view {}
}
