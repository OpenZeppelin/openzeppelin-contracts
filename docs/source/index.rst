.. zeppelin-solidity documentation master file, created by
   sphinx-quickstart on Tue Dec 13 11:35:05 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Documentation
=============================================

**Welcome to Zeppelin-Solidity!** Get familiar with the Zeppelin Smart Contracts.

Documentation
^^^^^^^^^^^^^^

.. toctree::
   :maxdepth: 2
   :caption: Contents:
   
   license
   hola

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

Smart Contracts
^^^^^^^^^^^^^^^

Ownable
--------
Base contract with an owner.

**Ownable( )**
++++++++++++++++
Sets the address of the creator of the contract as the owner.

modifier onlyOwner( )
++++++++++++++++++++++++
Prevents function from running if it is called by anyone other than the owner.

**transfer(address newOwner) onlyOwner**
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
Transfers ownership of the contract to the passed address.

---
### Stoppable
Base contract that provides an emergency stop mechanism.

Inherits from contract Ownable.

#### emergencyStop( ) external onlyOwner
Triggers the stop mechanism on the contract. After this function is called (by the owner of the contract), any function with modifier stopInEmergency will not run.

#### modifier stopInEmergency
Prevents function from running if stop mechanism is activated.

#### modifier onlyInEmergency
Only runs if stop mechanism is activated.

#### release( ) external onlyOwner onlyInEmergency
Deactivates the stop mechanism.

---
### Killable
Base contract that can be killed by owner.

Inherits from contract Ownable.

#### kill( ) onlyOwner
Destroys the contract and sends funds back to the owner.
___
### Claimable
Extension for the Ownable contract, where the ownership needs to be claimed

#### transfer(address newOwner) onlyOwner
Sets the passed address as the pending owner.

#### modifier onlyPendingOwner
Function only runs if called by pending owner.

#### claimOwnership( ) onlyPendingOwner
Completes transfer of ownership by setting pending owner as the new owner.
___
### Migrations
Base contract that allows for a new instance of itself to be created at a different address.

Inherits from contract Ownable.

#### upgrade(address new_address) onlyOwner
Creates a new instance of the contract at the passed address.

#### setCompleted(uint completed) onlyOwner
Sets the last time that a migration was completed.

___
### SafeMath
Provides functions of mathematical operations with safety checks.

#### assert(bool assertion) internal
Throws an error if the passed result is false. Used in this contract by checking mathematical expressions.

#### safeMul(uint a, uint b) internal returns (uint)
Multiplies two unisgned integers. Asserts that dividing the product by the non-zero multiplicand results in the multiplier.

#### safeSub(uint a, unit b) internal returns (uint)
Checks that b is not greater than a before subtracting.

#### safeAdd(unit a, unit b) internal returns (uint)
Checks that the result is greater than both a and b.

___
### LimitBalance

Base contract that provides mechanism for limiting the amount of funds a contract can hold.

#### LimitBalance(unit _limit)
Constructor takes an unisgned integer and sets it as the limit of funds this contract can hold.

#### modifier limitedPayable()
Throws an error if this contract's balance is already above the limit.

___
### PullPayment
Base contract supporting async send for pull payments.
Inherit from this contract and use asyncSend instead of send.

#### asyncSend(address dest, uint amount) internal
Adds sent amount to available balance that payee can pull from this contract, called by payer.

#### withdrawPayments( )
Sends designated balance to payee calling the contract. Throws error if designated balance is 0, if contract does not hold enough funds ot pay the payee, or if the send transaction is not successful.

___
### StandardToken
Based on code by FirstBlood: [FirstBloodToken.sol]

Inherits from contract SafeMath. Implementation of abstract contract ERC20 (see https://github.com/ethereum/EIPs/issues/20)

[FirstBloodToken.sol]: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol

#### approve(address _spender, uint _value) returns (bool success)
Sets the amount of the sender's token balance that the passed address is approved to use.

###allowance(address _owner, address _spender) constant returns (uint remaining)
Returns the approved amount of the owner's balance that the spender can use.

###balanceOf(address _owner) constant returns (uint balance)
Returns the token balance of the passed address.

###transferFrom(address _from, address _to, uint _value) returns (bool success)
Transfers tokens from an account that the sender is approved to transfer from. Amount must not be greater than the approved amount or the account's balance.

###function transfer(address _to, uint _value) returns (bool success)
Transfers tokens from sender's account. Amount must not be greater than sender's balance.

___
### BasicToken
Simpler version of StandardToken, with no allowances

#### balanceOf(address _owner) constant returns (uint balance)
Returns the token balance of the passed address.

###function transfer(address _to, uint _value) returns (bool success)
Transfers tokens from sender's account. Amount must not be greater than sender's balance.

___
### CrowdsaleToken
Simple ERC20 Token example, with crowdsale token creation.

Inherits from contract StandardToken.

#### createTokens(address recipient) payable
Creates tokens based on message value and credits to the recipient.

#### getPrice() constant returns (uint result)
Returns the amount of tokens per 1 ether.


.. toctree::
   :maxdepth: 2
   :caption: Contents:

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`