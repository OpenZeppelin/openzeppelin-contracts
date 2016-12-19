Claimable
=============================================

Extension for the Ownable contract, where the ownership needs to be claimed

transfer(address newOwner) onlyOwner
""""""""""""""""""""""""""""""""""""""

Sets the passed address as the pending owner.

modifier onlyPendingOwner
""""""""""""""""""""""""""""""""""""""

Function only runs if called by pending owner.

claimOwnership( ) onlyPendingOwner
""""""""""""""""""""""""""""""""""""""

Completes transfer of ownership by setting pending owner as the new owner.

