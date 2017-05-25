RefundableToken
=============================================

Simple ERC20 Token example, with refundable token creation.

refundRate() returns (uint)
"""""""""""""""""""""""""""""""""""""""""""""""
Returns the current refundRate (token to Ether) in percent form.


canRefund() internal returns (bool)
"""""""""""""""""""""""""""""""""""""""""""""""
An internal function that determines whether or not refunding is possible. Anyone who uses RefundableToken must define this function, otherwise the entire contract will be abstract.

setRefundRate(uint _newRefundRate) onlyOwner
"""""""""""""""""""""""""""""""""""""""""""""""
Allows the owner to set the refundRate (the exchange rate from token to Ether in percent form).

refund(uint _amount)
"""""""""""""""""""""""""""""""""""""""""""""""
Allows a token holder to get an Ether refund at the current refundRate if canRefund() returns True. Throws error if designated balance is 0, if the refundee does not have enough tokens, if contract does not hold enough funds to pay the refundee, or if the send transaction is not successful.