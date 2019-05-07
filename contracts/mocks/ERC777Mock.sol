pragma solidity ^0.5.0;

import "../drafts/ERC777/ERC777.sol";

contract ERC777Mock is ERC777 {
    constructor(
        address initialHolder,
        uint256 initialBalance,
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) public ERC777(name, symbol, defaultOperators) {
        _mint(msg.sender, initialHolder, initialBalance, "", "");
    }

    function mintInternal (
        address operator,
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        _mint(operator, to, amount, userData, operatorData);
    }
}
