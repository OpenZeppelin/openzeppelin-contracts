// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20CappedMockUpgradeable is Initializable, ERC20CappedUpgradeable {
    function __ERC20CappedMock_init(
        string memory name,
        string memory symbol,
        uint256 cap
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Capped_init_unchained(cap);
        __ERC20CappedMock_init_unchained(name, symbol, cap);
    }

    function __ERC20CappedMock_init_unchained(
        string memory,
        string memory,
        uint256
    ) internal onlyInitializing {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
    uint256[50] private __gap;
}
