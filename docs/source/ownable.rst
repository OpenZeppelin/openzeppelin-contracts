Ownable
=============================================

Base contract with an owner.

Ownable( )
""""""""""""""""""""""""""""""""""""""
Sets the address of the creator of the contract as the owner.

modifier onlyOwner( )
""""""""""""""""""""""""""""""""""""""
Prevents function from running if it is called by anyone other than the owner.

transferOwnership(address newOwner) onlyOwner
""""""""""""""""""""""""""""""""""""""
Transfers ownership of the contract to the passed address.
