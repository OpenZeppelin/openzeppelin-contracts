// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20VotesCompUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20VotesCompMockUpgradeable is Initializable, ERC20VotesCompUpgradeable {
    function __ERC20VotesCompMock_init(string memory name, string memory symbol) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __EIP712_init_unchained(name, "1");
        __ERC20Permit_init_unchained(name);
        __ERC20Votes_init_unchained();
        __ERC20VotesComp_init_unchained();
        __ERC20VotesCompMock_init_unchained(name, symbol);
    }

    function __ERC20VotesCompMock_init_unchained(string memory, string memory) internal onlyInitializing {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    uint256[50] private __gap;
}
