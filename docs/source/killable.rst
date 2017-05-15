Destructible
=============================================

Base contract that can be destroyed by owner.

Inherits from contract Ownable.

destroy( ) onlyOwner
"""""""""""""""""""

Destroys the contract and sends funds back to the owner.

destroyAndSend(address _recipient) onlyOwner
"""""""""""""""""""

Destroys the contract and sends funds back to the _recepient.