// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorMultiToken.sol";
import "../governance/extensions/IGovernorMultiToken.sol";

contract GovernorMultiTokenMock is GovernorMultiToken {
    constructor(
        IGovernorMultiToken[] memory assets
    )
        GovernorMultiToken(assets)
    {}
}
