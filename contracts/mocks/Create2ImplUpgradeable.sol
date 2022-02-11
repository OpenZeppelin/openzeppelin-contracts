// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Create2Upgradeable.sol";
import "../utils/introspection/ERC1820ImplementerUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract Create2ImplUpgradeable is Initializable {
    function __Create2Impl_init() internal onlyInitializing {
    }

    function __Create2Impl_init_unchained() internal onlyInitializing {
    }
    function deploy(
        uint256 value,
        bytes32 salt,
        bytes memory code
    ) public {
        Create2Upgradeable.deploy(value, salt, code);
    }

    function deployERC1820Implementer(uint256 value, bytes32 salt) public {
        Create2Upgradeable.deploy(value, salt, type(ERC1820ImplementerUpgradeable).creationCode);
    }

    function computeAddress(bytes32 salt, bytes32 codeHash) public view returns (address) {
        return Create2Upgradeable.computeAddress(salt, codeHash);
    }

    function computeAddressWithDeployer(
        bytes32 salt,
        bytes32 codeHash,
        address deployer
    ) public pure returns (address) {
        return Create2Upgradeable.computeAddress(salt, codeHash, deployer);
    }

    receive() external payable {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
