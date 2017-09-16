StandardToken
=============================================

Based on code by FirstBlood: `Link FirstBloodToken.sol <https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol/>`_

Inherits from contract SafeMath. Implementation of abstract contract ERC20 (see https://github.com/ethereum/EIPs/issues/20)

approve(address _spender, uint _value) returns (bool success)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Sets the amount of the sender's token balance that the passed address is approved to use.

allowance(address _owner, address _spender) constant returns (uint remaining)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Returns the approved amount of the owner's balance that the spender can use.

balanceOf(address _owner) constant returns (uint balance)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Returns the token balance of the passed address.

transferFrom(address _from, address _to, uint _value) returns (bool success)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Transfers tokens from an account that the sender is approved to transfer from. Amount must not be greater than the approved amount or the account's balance.

function transfer(address _to, uint _value) returns (bool success)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Transfers tokens from sender's account. Amount must not be greater than sender's balance.
