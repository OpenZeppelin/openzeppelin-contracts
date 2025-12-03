// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {
    MODULE_TYPE_HOOK,
    MODULE_TYPE_FALLBACK,
    MODULE_TYPE_VALIDATOR,
    IERC7579Hook,
    IERC7579Module,
    IERC7579Validator
} from "../../../interfaces/draft-IERC7579.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {PackedUserOperation} from "../../../interfaces/draft-IERC4337.sol";
import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {ERC4337Utils} from "../../../account/utils/draft-ERC4337Utils.sol";

abstract contract ERC7579ModuleMock is IERC7579Module {
    uint256 private _moduleTypeId;

    event ModuleInstalledReceived(address account, bytes data);
    event ModuleUninstalledReceived(address account, bytes data);

    constructor(uint256 moduleTypeId) {
        _moduleTypeId = moduleTypeId;
    }

    function onInstall(bytes calldata data) public virtual {
        emit ModuleInstalledReceived(msg.sender, data);
    }

    function onUninstall(bytes calldata data) public virtual {
        emit ModuleUninstalledReceived(msg.sender, data);
    }

    function isModuleType(uint256 moduleTypeId) external view returns (bool) {
        return moduleTypeId == _moduleTypeId;
    }
}

abstract contract ERC7579ModuleMaliciousMock is ERC7579ModuleMock {
    function onUninstall(bytes calldata /*data*/) public virtual override {
        revert("uninstall reverts");
    }
}

abstract contract ERC7579HookMock is ERC7579ModuleMock(MODULE_TYPE_HOOK), IERC7579Hook {
    event PreCheck(address sender, uint256 value, bytes data);
    event PostCheck(bytes hookData);

    function preCheck(
        address msgSender,
        uint256 value,
        bytes calldata msgData
    ) external returns (bytes memory hookData) {
        emit PreCheck(msgSender, value, msgData);
        return msgData;
    }

    function postCheck(bytes calldata hookData) external {
        emit PostCheck(hookData);
    }
}

abstract contract ERC7579FallbackHandlerMock is ERC7579ModuleMock(MODULE_TYPE_FALLBACK) {
    event ERC7579FallbackHandlerMockCalled(address account, address sender, uint256 value, bytes data);

    error ERC7579FallbackHandlerMockRevert();

    function _msgAccount() internal view returns (address) {
        return msg.sender;
    }

    function _msgSender() internal pure returns (address) {
        return address(bytes20(msg.data[msg.data.length - 20:]));
    }

    function _msgData() internal pure returns (bytes calldata) {
        return msg.data[:msg.data.length - 20];
    }

    function callPayable() public payable {
        emit ERC7579FallbackHandlerMockCalled(_msgAccount(), _msgSender(), msg.value, _msgData());
    }

    function callView() public view returns (address, address) {
        return (_msgAccount(), _msgSender());
    }

    function callRevert() public pure {
        revert ERC7579FallbackHandlerMockRevert();
    }
}

abstract contract ERC7579ValidatorMock is ERC7579ModuleMock(MODULE_TYPE_VALIDATOR), IERC7579Validator {
    mapping(address sender => address signer) private _associatedSigners;

    function onInstall(bytes calldata data) public virtual override(IERC7579Module, ERC7579ModuleMock) {
        _associatedSigners[msg.sender] = address(bytes20(data[0:20]));
        super.onInstall(data);
    }

    function onUninstall(bytes calldata data) public virtual override(IERC7579Module, ERC7579ModuleMock) {
        delete _associatedSigners[msg.sender];
        super.onUninstall(data);
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public view virtual returns (uint256) {
        return
            SignatureChecker.isValidSignatureNow(_associatedSigners[msg.sender], userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    function isValidSignatureWithSender(
        address /*sender*/,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return
            SignatureChecker.isValidSignatureNow(_associatedSigners[msg.sender], hash, signature)
                ? IERC1271.isValidSignature.selector
                : bytes4(0xffffffff);
    }
}
