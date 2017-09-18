pragma solidity ^0.4.11;


import '../../contracts/token/BasicToken.sol';


contract ERC23ContractInterface {
  function tokenFallback(address _from, uint256 _value, bytes _data) external;
}

contract ERC23TokenMock is BasicToken {

  function ERC23TokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

  // ERC23 compatible transfer function (except the name)
  function transferERC23(address _to, uint256 _value, bytes _data)
    returns (bool success)
  {
    transfer(_to, _value);
    bool is_contract = false;
    assembly {
      is_contract := not(iszero(extcodesize(_to)))
    }
    if(is_contract) {
      ERC23ContractInterface receiver = ERC23ContractInterface(_to);
      receiver.tokenFallback(msg.sender, _value, _data);
    }
    return true;
  }
}
