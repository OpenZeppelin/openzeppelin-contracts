PullPayment
=============================================

Base contract supporting async send for pull payments. Inherit from this contract and use asyncSend instead of send.

asyncSend(address dest, uint amount) internal
"""""""""""""""""""""""""""""""""""""""""""""""
Adds sent amount to available balance that payee can pull from this contract, called by payer.

withdrawPayments( )
"""""""""""""""""""""""""""""""""""""""""""""""
Sends designated balance to payee calling the contract. Throws error if designated balance is 0, if contract does not hold enough funds to pay the payee, or if the send transaction is not successful.
