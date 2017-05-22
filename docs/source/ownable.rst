Ownable
=============================================

Ownable contracts provide an authorization layer, this simplifies the implementation of "user permissions", allowing for specific actions to be restricted to a specific accounts or groups of accounts. 

The Zeppelin framework includes several `ownership contracts <https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts/ownership>`_.


********
Ownable.sol
********

`Ownable.sol <https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/ownership/Ownable.sol>`_

This is the basic Ownable contract. Upon deployment, the owner is set to the contract creator (``msg.sender``).

It has been `reviewed <http://linktoreview.info>`_ and is considered very safe. 

Interface
==================================

    
    function Ownable()

The constructor sets the address of the creator of the contract as the owner.


    modifier onlyOwner( )

Prevents function from running if it is called by anyone other than the owner.

    transfer(address newOwner) onlyOwner

Transfers ownership of the contract to the passed address.

********
Claimable.sol
********

`Claimable.sol <https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/ownership/Claimable.sol>`_

Extension for the Ownable contract, where the ownership needs to be claimed. This allows the new owner to accept the transfer.

It has not yet received a complete peer review, but it is a very simple contract, and we consider it to be safe. 

Interface
==================================
  
    modifier onlyPendingOwner()
    
Say what this does...

    function transferOwnership(address newOwner) onlyOwner
    
Say what this does...

    function claimOwnership() onlyPendingOwner

Say what this does...