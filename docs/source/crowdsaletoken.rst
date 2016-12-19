CrowdsaleToken
=============================================

Simple ERC20 Token example, with crowdsale token creation.

Inherits from contract StandardToken.

createTokens(address recipient) payable
"""""""""""""""""""""""""""""""""""""""""
Creates tokens based on message value and credits to the recipient.

getPrice() constant returns (uint result)
"""""""""""""""""""""""""""""""""""""""""
Returns the amount of tokens per 1 ether.