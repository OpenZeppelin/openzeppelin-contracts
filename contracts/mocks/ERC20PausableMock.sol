pragma solidity ^0.6.0;

import "../token/ERC20/ERC20Pausable.sol";

// mock class using ERC20Pausable
contract ERC20PausableMock is ERC20Pausable {
    constructor (address initialAccount, uint256 initialBalance) public {
        _mint(initialAccount, initialBalance);
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }
}
