// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountSignerECDSA} from "./AccountSignerECDSA.sol";

abstract contract AccountSignerEOA is AccountSignerECDSA {
    /// @inheritdoc AccountSignerECDSA
    function signer() public view override returns (address) {
        return address(this);
    }
}
