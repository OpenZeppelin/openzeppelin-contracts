// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorIntegratedTimelock.sol";
import "./GovernanceMock.sol";

contract GovernanceWithTimelockMock is GovernanceMock, GovernorIntegratedTimelock {

    constructor(string memory name_, string memory version_, IComp token_, uint256 delay_)
    GovernanceMock(name_, version_, token_)
    GovernorIntegratedTimelock(delay_)
    {}

    function queue(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public returns (bytes32)
    {
        return _queue(target, value, data, salt);
    }

    function _execute(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual override(Governor, GovernorIntegratedTimelock)
    {
        GovernorIntegratedTimelock._execute(id, target, value, data, salt);
    }
}
