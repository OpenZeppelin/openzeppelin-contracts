// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {IERC7579Module} from "../../../interfaces/draft-IERC7579.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {ERC7579Validator} from "../../../account/modules/ERC7579Validator.sol";

contract ERC7579Signature is ERC7579Validator {
    mapping(address account => bytes signer) private _signers;

    event ERC7579SignatureSignerSet(address indexed account, bytes signer);

    error ERC7579SignatureInvalidSignerLength();

    function signer(address account) public view virtual returns (bytes memory) {
        return _signers[account];
    }

    function onInstall(bytes calldata data) public virtual {
        if (signer(msg.sender).length == 0) {
            setSigner(data);
        }
    }

    function onUninstall(bytes calldata) public virtual {
        _setSigner(msg.sender, "");
    }

    function setSigner(bytes memory signer_) public virtual {
        require(signer_.length >= 20, ERC7579SignatureInvalidSignerLength());
        _setSigner(msg.sender, signer_);
    }

    function _setSigner(address account, bytes memory signer_) internal virtual {
        _signers[account] = signer_;
        emit ERC7579SignatureSignerSet(account, signer_);
    }

    function _rawERC7579Validation(
        address account,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        return SignatureChecker.isValidSignatureNow(signer(account), hash, signature);
    }
}
