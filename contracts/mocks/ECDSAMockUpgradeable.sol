// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSAUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ECDSAMockUpgradeable is Initializable {
    function __ECDSAMock_init() internal onlyInitializing {
    }

    function __ECDSAMock_init_unchained() internal onlyInitializing {
    }
    using ECDSAUpgradeable for bytes32;
    using ECDSAUpgradeable for bytes;

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    // solhint-disable-next-line func-name-mixedcase
    function recover_v_r_s(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (address) {
        return hash.recover(v, r, s);
    }

    // solhint-disable-next-line func-name-mixedcase
    function recover_r_vs(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) public pure returns (address) {
        return hash.recover(r, vs);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }

    function toEthSignedMessageHash(bytes memory s) public pure returns (bytes32) {
        return s.toEthSignedMessageHash();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
