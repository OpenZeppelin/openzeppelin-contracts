Pausable
=============================================

Base contract that provides a pause mechanism.

Inherits from contract Ownable.

pause() onlyOwner whenNotPaused returns (bool)
"""""""""""""""""""""""""""""""""""""

Triggers pause mechanism on the contract. After this function is called (by the owner of the contract), any function with modifier whenNotPaused will not run.


modifier whenNotPaused()
"""""""""""""""""""""""""""""""""""""

Prevents function from running if pause mechanism is activated.

modifier whenPaused()
"""""""""""""""""""""""""""""""""""""

Only runs if pause mechanism is activated.

unpause() onlyOwner whenPaused returns (bool)
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Deactivates the pause mechanism.
