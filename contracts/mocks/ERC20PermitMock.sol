pragma solidity ^0.6.0;

import "../token/ERC20/ERC20Permit.sol";

contract ERC20PermitMock is ERC20Permit {
    constructor (
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) public payable ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }
}
