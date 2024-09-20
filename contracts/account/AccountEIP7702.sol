// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountECDSA} from "./AccountECDSA.sol";

abstract contract AccountEIP7702 is AccountECDSA {
    /// @inheritdoc AccountECDSA
    function signer() public view override returns (address) {
        return address(this);
    }
}
