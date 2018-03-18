pragma solidity ^0.4.9;


import "../token/ERC223/ERC223Token.sol";


contract ERC223TokenMock is ERC223Token {
    function ERC223TokenMock(string _name, string _symbol, uint8 _decimals, uint256 _supply) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _supply * (10 ** uint256(decimals));
        balances[msg.sender] = totalSupply;
    }
}