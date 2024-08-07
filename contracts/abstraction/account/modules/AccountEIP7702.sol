// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountValidateECDSA} from "./validation/AccountValidateECDSA.sol";
import {ERC4337Utils} from "../../utils/ERC4337Utils.sol";
import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";

/**
 * @dev Extension of AccountValidateECDSA that grants access to the private key which address matches the one of this
 * Account. In the case of an account instanciated at the address of an EOA using EIP-7702, using this module will
 * allow the EOA's private key to control the account.
 */
abstract contract Account7702 is AccountValidateECDSA {
    /// @inheritdoc AccountValidateECDSA
    function _isSigner(address signer) internal view virtual override returns (bool) {
        return signer == address(this) || super._isSigner(signer);
    }
}
