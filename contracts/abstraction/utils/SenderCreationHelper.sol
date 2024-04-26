// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Call} from "../../utils/Call.sol";

/**
 * @dev This is used as an helper by EntryPoint. Because creating an account requires calling an arbitrary (user
 * controlled) factory with arbitrary (user controlled) data, its a call that can be used to impersonate the
 * entrypoint. To avoid any potential issues, we bounce this operation through this helper. This removed the risk of
 * a user using a malicious initCode to impersonate the EntryPoint.
 */
contract SenderCreationHelper {
    error SenderAddressResult(address sender);

    function createSender(bytes calldata initCode) public returns (address) {
        return
            Call.call(address(bytes20(initCode[0:20])), 0, initCode[20:]) && Call.getReturnDataSize() >= 0x20
                ? abi.decode(Call.getReturnData(0x20), (address))
                : address(0);
    }

    function createSenderAndRevert(bytes calldata initCode) public returns (address) {
        revert SenderAddressResult(createSender(initCode));
    }

    function getSenderAddress(bytes calldata initCode) public returns (address sender) {
        try this.createSenderAndRevert(initCode) {
            return address(0); // Should not happen
        } catch (bytes memory reason) {
            if (reason.length != 0x24 || bytes4(reason) != SenderAddressResult.selector) {
                return address(0); // Should not happen
            } else {
                assembly {
                    sender := mload(add(0x24, reason))
                }
            }
        }
    }
}
