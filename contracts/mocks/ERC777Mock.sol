pragma solidity ^0.5.2;

import "../drafts/ERC777/ERC777.sol";

contract ERC777Mock is ERC777 {
    constructor (
        address initialHolder,
        uint256 initialBalance,
        string memory name,
        string memory symbol,
        uint256 granularity,
        address[] memory defaultOperators
    ) public ERC777(name, symbol, granularity, defaultOperators) {
        _mint(msg.sender, initialHolder, initialBalance, "", "");
    }
}
