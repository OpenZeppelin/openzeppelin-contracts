pragma solidity ^0.4.18;

import '../../contracts/token/Basic223Token.sol';

// mock class using Basic223Token
contract Basic223TokenMock is Basic223Token {

    function Basic223TokenMock(address _initialAccount, uint256 _initialBalance) {
    	balances[_initialAccount] = _initialBalance;
        totalSupply = _initialBalance;
    }
}
