Pausable
=============================================

Base contract that provides an emergency stop mechanism.

Inherits from contract Ownable.

emergencyStop( ) external onlyOwner
"""""""""""""""""""""""""""""""""""""

Triggers the stop mechanism on the contract. After this function is called (by the owner of the contract), any function with modifier stopInEmergency will not run.

modifier stopInEmergency
"""""""""""""""""""""""""""""""""""""

Prevents function from running if stop mechanism is activated.

modifier onlyInEmergency
"""""""""""""""""""""""""""""""""""""

Only runs if stop mechanism is activated.

release( ) external onlyOwner onlyInEmergency
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

Deactivates the stop mechanism.