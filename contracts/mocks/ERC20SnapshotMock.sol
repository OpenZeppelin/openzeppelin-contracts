pragma solidity ^0.6.0;

import "../token/ERC20/ERC20Snapshot.sol";


contract ERC20SnapshotMock is ERC20Snapshot {
    constructor(address initialAccount, uint256 initialBalance) public {
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
}
