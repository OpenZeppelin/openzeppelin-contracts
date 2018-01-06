DelayedClaimable
=============================================
Extension for the Claimable contract, where the ownership needs to be claimed before/after a certain block number.

setLimits(uint256 _start, uint256 _end) onlyOwner
""""""""""""""""""""""""""""""""""""""
Specifies the time period during which a pending owner can claim ownership.


claimOwnership( ) onlyPendingOwner
""""""""""""""""""""""""""""""""""""""

Completes transfer of ownership by setting pending owner as the new owner.
