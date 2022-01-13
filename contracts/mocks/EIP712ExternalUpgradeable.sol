// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/draft-EIP712Upgradeable.sol";
import "../utils/cryptography/ECDSAUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract EIP712ExternalUpgradeable is Initializable, EIP712Upgradeable {
    function __EIP712External_init(string memory name, string memory version) internal onlyInitializing {
        __EIP712_init_unchained(name, version);
        __EIP712External_init_unchained(name, version);
    }

    function __EIP712External_init_unchained(string memory, string memory) internal onlyInitializing {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function verify(
        bytes memory signature,
        address signer,
        address mailTo,
        string memory mailContents
    ) external view {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(keccak256("Mail(address to,string contents)"), mailTo, keccak256(bytes(mailContents))))
        );
        address recoveredSigner = ECDSAUpgradeable.recover(digest, signature);
        require(recoveredSigner == signer);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    uint256[50] private __gap;
}
