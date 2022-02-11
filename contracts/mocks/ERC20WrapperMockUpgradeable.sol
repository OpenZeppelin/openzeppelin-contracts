// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20WrapperUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20WrapperMockUpgradeable is Initializable, ERC20WrapperUpgradeable {
    function __ERC20WrapperMock_init(
        IERC20Upgradeable _underlyingToken,
        string memory name,
        string memory symbol
    ) internal onlyInitializing {
        __ERC20_init_unchained(name, symbol);
        __ERC20Wrapper_init_unchained(_underlyingToken);
    }

    function __ERC20WrapperMock_init_unchained(
        IERC20Upgradeable,
        string memory,
        string memory
    ) internal onlyInitializing {}

    function recover(address account) public returns (uint256) {
        return _recover(account);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
