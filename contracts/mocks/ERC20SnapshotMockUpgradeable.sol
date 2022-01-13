// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20SnapshotUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20SnapshotMockUpgradeable is Initializable, ERC20SnapshotUpgradeable {
    function __ERC20SnapshotMock_init(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Snapshot_init_unchained();
        __ERC20SnapshotMock_init_unchained(name, symbol, initialAccount, initialBalance);
    }

    function __ERC20SnapshotMock_init_unchained(
        string memory,
        string memory,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        _mint(initialAccount, initialBalance);
    }

    function snapshot() public {
        _snapshot();
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
    uint256[50] private __gap;
}
