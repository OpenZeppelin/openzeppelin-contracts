pragma solidity ^0.4.11;

import "../implementation/ERC223BasicToken.sol";

contract ERC223ExampleToken is ERC223BasicToken {
    function ERC223ExampleToken(uint initialBalance) {
        balances[msg.sender] = initialBalance;
        totalSupply = initialBalance;
        // Ideally call token fallback here too
    }
}
