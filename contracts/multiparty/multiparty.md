| eip       | title             | author                                       |  type             | created    |
| ----------|:-----------------:| --------------------------------------------:| ----------------- |--------- :|
| 3742        | Contract Standard | Saurabh Santhosh <saurabhsanthosh@gmail.com> | Standards Track   |2021-08-15 |


## Simple Summary

A standard interface for co-owning assets like ERC20, ERC721, ETH etc.
and to approve/execute contract transactions in a democratic way


## Abstract

The following standard allows for the implementation of a standard API for co-owning assets within smart contracts. This standard provides basic functionality to addMembers, removeMembers and create/execute contract transactions approved by all members of the contract. Some of the possible actions are token transferring, operator approvals and member addition/removals.Its important to note that every Group of users will be a new instance of the contract having a unique address.



## Motivation

Today there is no standard way for multiple people to co-own/manage the contracts as a group in a truly democratic way. This standard can be used by contract developers to create smart contracts enabling multiple users to manage their contracts in a secure and democratic way.



## Specification

## Token
### Methods

**NOTES**:
- The following specifications use syntax from Solidity 0.8.0 (or above)
- Callers MUST handle false returns (bool success). Callers MUST NOT assume that false is never returned!
- There should be a modifier onlySelf which checks if msg.sender is the contract itself



#### name

Returns the name of the group - e.g. `"MyGroup"`.

OPTIONAL - This method can be used to improve usability,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function name() external view returns (string)
```


#### symbol

Returns the symbol of the group. E.g. "MyGRP".

OPTIONAL - This method can be used to improve usability,
but interfaces and other contracts MUST NOT expect these values to be present.

``` js
function symbol() external view returns (string)
```



#### totalMembers

Returns the total members in the group.

``` js
function totalMembers() external view returns (uint256)
```



#### isMember

Returns if the given `member` is a member of the group.

``` js
function isMember(address member) external view returns (bool)
```



#### createAction

Create an action/proposal which is open for approval for all members of the group. An action consists of one or more methods that have to be executed once it's approved. Only an existing member can create an action.


*Note* This method MUST fire the `ActionStateChanged` event state=1.

``` js
function createAction(bytes4[] memory methods, bytes[] memory args) external returns (uint256 actionId)
```



#### getActionInfo

Returns the details of an already created action/proposal which is open for approval for all members of the group.

``` js
function getActionInfo(uint256 actionId) external view returns (bytes4[] memory methods, bytes[] memory args, uint256 state)
```



#### approveAction

Allows an existing `member`  of the group to approve/reject an already created action/proposal.

*Note* This method MUST fire the `ActionStateChanged` event with state=2.


``` js
function approveAction(uint256 actionId, bool approved) external returns (bool)
```


#### isActionApprovedByUser

Returns true if an action with given `actionId`  is approved by `member` of the group.


``` js
function isActionApprovedByUser(uint256 actionId, address member) external view returns (bool)
```

#### isActionApproved

Returns true if an action with given `actionId` is approved by all existing members of the group.
It’s up to the contract creators to decide if this method should look at majority votes (based on ownership)
or if it should ask consent of all the users irrespective of their ownerships.



``` js
function isActionApproved(uint256 actionId) external view returns (bool)
```

#### executeAction

Executes the action referenced by the given `actionId` as long as it is approved by all existing members of the group.
The executeAction executes all methods as part of given action in an atomic way (either all should succeed or none should succeed).
Once executed, the action should be set as executed (state=3) so that it cannot be executed again.

*Note*  This method MUST fire the `ActionStateChanged` event with state=3.


``` js
function executeAction(uint256 actionId) external returns (bool)
```

#### addMember

Allows existing members of the group to add a new `_member` to the group.This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)


``` js
function addMember(address member) external onlySelf returns (bool)
```

#### removeMember

Allows existing members of the group to remove an already existing `member` from the group.This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)



``` js
function removeMember(address member) external onlySelf returns (bool)
```

#### setOwnership

Set the ownership for a given `member` of the group. We must make sure that the total ownership of all members in the group is <= 100. This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)


OPTIONAL - This method can be used if the developer wants complex approvals based on ownership percentages,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function setOwnership(address member, uint256 ownership) external onlySelf returns (bool)
```


Some of the other recommended methods are mentioned below which allows the group to hold  ERC-20, ERC-721 tokens.
These are completely optional and is upto developers to decide which all methods they need


#### transfer

Transfers `value` amount of ETH to address `to`. This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group.
(Approval is defined by the `isActionApproved` method)



OPTIONAL - This method can be used if the developer wants his/her contracts to have this functionality,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function transfer(address to, uint256 value) external onlySelf returns (bool success)
```

#### transferERC20

Transfers `value` amount of tokens of `from` address to address `_to`.
For this to happen `erc20Contract` should either own/approved to transfer the tokens.
This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)



OPTIONAL - This method can be used if the developer wants his/her contracts to have this functionality,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function transferERC20(address erc20Contract, address from, address to, uint256 value) external onlySelf returns (bool success)
```

#### approveERC20

Allows `spender` to withdraw from your group multiple times, up to the `value` amount. If this function is called again it overwrites the current allowance with `value`. This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)



OPTIONAL - This method can be used if the developer wants his/her contracts to have this functionality,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function approveERC20(address erc20Contract, address spender, uint256 value) external onlySelf returns (bool success)
```

#### transferERC721

Transfers token with id `tokenid`  of `from` address to address `to`.
For this to happen `erc721Contract` should either own/approved to transfer the token.
This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)



OPTIONAL - This method can be used if the developer wants his/her contracts to have this functionality,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function transferERC721(address erc721Contract, address from, address to, uint256 tokenId) external onlySelf returns (bool success)
```


#### approveERC721

Allows `spender` to withdraw a token with given `tokenId` from your group. This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)



OPTIONAL - This method can be used if the developer wants his/her contracts to have this functionality,
but interfaces and other contracts MUST NOT expect these values to be present.


``` js
function approveERC721(address erc721Contract, address spender, uint256 tokenId) external onlySelf returns (bool success)
```

### setApprovalForAllERC721

Approve or remove `operator` as an operator for the caller. This method should be external with `onlySelf` modifier and will be executed only if it's approved by the group. (Approval is defined by the `isActionApproved` method)

``` js
function setApprovalForAllERC721(address erc721Contract, address operator, bool approved) external onlySelf returns (bool success)
```

We can have any method here we want to execute based on approval. We just have to make sure they are internal and can only be executed
via `executeAction` function

### Events


#### ActionStateChanged

MUST trigger when actions are created, approved, executed.


``` js
event ActionStateChanged(uint256 _actionId, address _from, uint256 _state)
```

#### ActionMethodExecuted

MUST trigger when each method in an action is executed.


``` js
event ActionMethodExecuted(uint256 actionId, bytes4 method, bytes args, bool success, bytes returnData);
```


## Implementation

There may already be existing contracts doing similar actions deployed on the Ethereum network.
Hopefully with single standard, it will make it easier for contract developers to handle the above mentioned
scenarios in efficient and secure manner


## History

Historical links related to this standard:

- First proposal : https://ethereum-magicians.org/t/contract-standard-for-co-owning-assets/6877
- Reddit discussion: https://www.reddit.com/r/ethdev/comments/p6obar/what_do_you_guys_think_about_this_eip/



## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
