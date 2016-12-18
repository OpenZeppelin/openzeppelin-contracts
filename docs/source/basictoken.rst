BasicToken
=============================================

Simpler version of StandardToken, with no allowances

balanceOf(address _owner) constant returns (uint balance)
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Returns the token balance of the passed address.

function transfer(address _to, uint _value) returns (bool success)
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
Transfers tokens from sender's account. Amount must not be greater than sender's balance.