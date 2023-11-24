# ERC-7254

## Abstract

With the aspiration of bringing forth unique functionality and enhancing value for holders of [ERC-20](./eip-20.md) tokens, our project aims to effortlessly reward token holders without necessitating users to lock, stake, or farm their tokens. Whenever the project generates profits, these profits can be distributed to the token holders.

Revenue Sharing is an extended version of [ERC-20](./eip-20.md). It proposes an additional payment method for token holders. 

This standard includes updating rewards for holders and allowing token holders to withdraw rewards.

Potential use cases encompass:

* Companies distributing dividends to token holders.
* Direct sharing of revenue derived from business activities, such as marketplaces, Automated Market Makers (AMMs), and games.


## Specification

### Methods

#### maxTokenReward

Returns  max token reward.

``` js
function maxTokenReward() public view returns (uint256)
```

#### informationOf

Returns the account information of another account with the address `token` and `account`, including: inReward, outReward and withdraw.

``` js
function informationOf(address token, address account) public view returns (UserInformation memory)
```

#### informationOfBatch

Returns the list account information of another account with the `account`, including: inReward, outReward and withdraw.

``` js
function informationOfBatch(address account) public view returns (UserInformation[] memory)
```

#### UserInformation

`inReward`: when user's balance decreases, inReward will be updated
`outReward`: when user's balance increases, outReward will be updated
`withdraw`: total amount of reward tokens withdrawn

```solidity
struct UserInformation {
    uint256 inReward;
    uint256 outReward;
    uint256 withdraw;
}
```

#### tokenReward

Returns the list token reward address of the token.

``` js
function tokenReward() public view returns (address[] memory)
```

#### updateReward

Updates rewardPerShare of token reward.
rewardPerShare = rewardPerShare + amount / totalSupply()

``` js
function updateReward(address[] memory token, uint256[] memory amount) public
```

#### viewReward

Returns the list amount of reward for an account

``` js
function viewReward(address account) public view returns (uint256[] memory)
```

#### getReward

Gets and returns reward with list token reward.

``` js
function getReward(address[] memory token) public
```

#### getRewardPerShare

Returns the reward per share of token reward.

``` js
function getRewardPerShare(address token) public view returns (uint256)
```

#### existsTokenReward

Returns the status of token reward.

``` js
function existsTokenReward(address token) public view returns (bool)
```