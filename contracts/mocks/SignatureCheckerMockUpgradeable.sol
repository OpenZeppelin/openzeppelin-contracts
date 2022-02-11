// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/SignatureCheckerUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract SignatureCheckerMockUpgradeable is Initializable {
    function __SignatureCheckerMock_init() internal onlyInitializing {
    }

    function __SignatureCheckerMock_init_unchained() internal onlyInitializing {
    }
    using SignatureCheckerUpgradeable for address;

    function isValidSignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) public view returns (bool) {
        return signer.isValidSignatureNow(hash, signature);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
