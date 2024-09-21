// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SignerECDSA} from "./SignerECDSA.sol";

abstract contract SignerEIP7702 is SignerECDSA {
    /// @inheritdoc SignerECDSA
    function signer() public view override returns (address) {
        return address(this);
    }
}
