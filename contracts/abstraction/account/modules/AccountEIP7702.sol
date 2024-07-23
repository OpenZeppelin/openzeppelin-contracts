// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountValidateECDSA} from "./validation/AccountValidateECDSA.sol";
import {ERC4337Utils} from "../../utils/ERC4337Utils.sol";
import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";

abstract contract Account7702 is AccountValidateECDSA {
    function _isSigner(address signer) internal view virtual override returns (bool) {
        return signer == address(this);
    }
}
