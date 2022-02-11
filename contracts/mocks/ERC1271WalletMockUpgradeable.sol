// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/OwnableUpgradeable.sol";
import "../interfaces/IERC1271Upgradeable.sol";
import "../utils/cryptography/ECDSAUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1271WalletMockUpgradeable is Initializable, OwnableUpgradeable, IERC1271Upgradeable {
    function __ERC1271WalletMock_init(address originalOwner) internal onlyInitializing {
        __Ownable_init_unchained();
        __ERC1271WalletMock_init_unchained(originalOwner);
    }

    function __ERC1271WalletMock_init_unchained(address originalOwner) internal onlyInitializing {
        transferOwnership(originalOwner);
    }

    function isValidSignature(bytes32 hash, bytes memory signature) public view override returns (bytes4 magicValue) {
        return ECDSAUpgradeable.recover(hash, signature) == owner() ? this.isValidSignature.selector : bytes4(0);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
