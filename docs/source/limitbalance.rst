LimitBalance
=============================================

Base contract that provides mechanism for limiting the amount of funds a contract can hold.

LimitBalance(unit _limit)
""""""""""""""""""""""""""""
Constructor takes an unsigned integer and sets it as the limit of funds this contract can hold.

modifier limitedPayable()
""""""""""""""""""""""""""""
Throws an error if this contract's balance is already above the limit.
