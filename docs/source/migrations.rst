Migrations
=============================================

Base contract that allows for a new instance of itself to be created at a different address.

Inherits from contract Ownable.

upgrade(address new_address) onlyOwner
""""""""""""""""""""""""""""""""""""""""

Creates a new instance of the contract at the passed address.

setCompleted(uint completed) onlyOwner**
""""""""""""""""""""""""""""""""""""""""

Sets the last time that a migration was completed.
