---
id: learn-about-crowdsales
title: Learn About Crowdsales
---

Crowdsales are a popular use for Ethereum; they let you allocate tokens to network participants in various ways, mostly in exchange for Ether. They come in a variety of shapes and flavors, so let's go over the various types available in OpenZeppelin and how to use them.

Crowdsales have a bunch of different properties, but here are some important ones:
- Price & Rate Configuration
  - Does your crowdsale sell tokens at a fixed price?
  - Does the price change over time or as a function of demand?
- Emission
  - How is this token actually sent to participants?
- Validation — Who is allowed to purchase tokens?
  - Are there KYC / AML checks?
  - Is there a max cap on tokens?
  - What if that cap is per-participant?
  - Is there a starting and ending time frame?
- Distribution
  - Does distribution of funds happen in real-time or after the crowdsale?
  - Can participants receive a refund if the goal is not met?

To manage all of the different combinations and flavors of crowdsales, OpenZeppelin provides a highly configurable [`Crowdsale.sol`](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) base contract that can be combined with various other functionalities to construct a bespoke crowdsale.

## Crowdsale Rate

Understanding the rate of a crowdsale is super important, and mistakes here are a common source of bugs.

✨ **HOLD UP FAM THIS IS IMPORTANT** ✨

Firstly, **all currency math is done in the smallest unit of that currency and converted to the correct decimal places when _displaying_ the currency**.

This means that when you do math in your smart contracts, you need to understand that you're adding, dividing, and multiplying the smallest amount of a currency (like wei), _not_ the commonly-used displayed value of the currency (Ether).

In Ether, the smallest unit of the currency is wei, and `1 ETH === 10^18 wei`. In tokens, the process is _very similar_: `1 TKN === 10^(decimals) TKNbits`.

- The smallest unit of a token is "bits" or `TKNbits`.
- The display value of a token is `TKN`, which is `TKNbits * 10^(decimals)`

What people usually call "one token" is actually a bunch of TKNbits, displayed to look like `1 TKN`. This is the same relationship that Ether and wei have. And what you're _always_ doing calculations in is **TKNbits and wei**.

So, if you want to issue someone "one token for every 2 wei" and your decimals are 18, your rate is `0.5e17`. Then, when I send you `2 wei`, your crowdsale issues me `2 * 0.5e17 TKNbits`, which is exactly equal to `10^18 TKNbits` and is displayed as `1 TKN`.

If you want to issue someone "`1 TKN` for every `1 ETH`", and your decimals are 18, your rate is `1`. This is because what's actually happening with the math is that the contract sees a user send `10^18 wei`, not `1 ETH`. Then it uses your rate of 1 to calculate `TKNbits = rate * wei`, or `1 * 10^18`, which is still `10^18`. And because your decimals are 18, this is displayed as `1 TKN`.

One more for practice: if I want to issue "1 TKN for every dollar (USD) in Ether", we would calculate it as follows:

- assume 1 ETH == $400
- therefore, 10^18 wei = $400
- therefore, 1 USD is `10^18 / 400`, or `2.5 * 10^15 wei`
- we have a decimals of 18, so we'll use `10 ^ 18 TKNbits` instead of `1 TKN`
- therefore, if the participant sends the crowdsale `2.5 * 10^15 wei` we should give them `10 ^ 18 TKNbits`
- therefore the rate is `2.5 * 10^15 wei === 10^18 TKNbits`, or `1 wei = 400 TKNbits`
- therefore, our rate is `400`

(this process is pretty straightforward when you keep 18 decimals, the same as Ether/wei)


## Token Emission

One of the first decisions you have to make is "how do I get these tokens to users?". This is usually done in one of three ways:

- (default) — The Crowdsale contract owns tokens and simply transfers tokens from its own ownership to users that purchase them.
- [MintedCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/emission/MintedCrowdsale.sol) — The Crowdsale mints tokens when a purchase is made.
- [AllowanceCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/emission/AllowanceCrowdsale.sol) — The Crowdsale is granted an allowance to another wallet (like a Multisig) that already owns the tokens to be sold in the crowdsale.

### Default Emission

In the default scenario, your crowdsale must own the tokens that are sold. You can send the crowdsale tokens through a variety of methods, but here's what it looks like in Solidity:

```solidity
IERC20(tokenAddress).transfer(CROWDSALE_ADDRESS, SOME_TOKEN_AMOUNT);
```

Then when you deploy your crowdsale, simply tell it about the token

```solidity
new Crowdsale(
    1,             // rate in TKNbits
    MY_WALLET,     // address where Ether is sent
    TOKEN_ADDRESS  // the token contract address
);
```

### Minted Crowdsale

To use a `MintedCrowdsale`, your token must also be a `ERC20Mintable` token that the crowdsale has permission to mint from. This can look like:

```solidity
contract MyToken is ERC20, ERC20Mintable {
    // ... see "Learn About Tokens" for more info
}

contract MyCrowdsale is Crowdsale, MintedCrowdsale {
    constructor(
        uint256 rate,    // rate in TKNbits
        address wallet,
        ERC20 token
    )
        MintedCrowdsale()
        Crowdsale(rate, wallet, token)
        public
    {

    }
}

contract MyCrowdsaleDeployer {
    constructor()
        public
    {
        // create a mintable token
        ERC20Mintable token = new MyToken();

        // create the crowdsale and tell it about the token
        Crowdsale crowdsale = new MyCrowdsale(
            1,               // rate, still in TKNbits
            msg.sender,      // send Ether to the deployer
            address(token)   // the token
        );
        // transfer the minter role from this contract (the default)
        // to the crowdsale, so it can mint tokens
        token.addMinter(address(crowdsale));
        token.renounceMinter();
    }
}
```

### AllowanceCrowdsale

Use an `AllowanceCrowdsale` to send tokens from another wallet to the participants of the crowdsale. In order for this to work, the source wallet must give the crowdsale an allowance via the ERC20 `approve(...)` method.

```solidity
contract MyCrowdsale is AllowanceCrowdsale, Crowdsale {
    constructor(
        uint256 rate,
        address wallet,
        ERC20 token,
        address tokenWallet  // <- new argument
    )
        AllowanceCrowdsale(tokenWallet)  // <- used here
        Crowdsale(rate, wallet, token)
        public
    {

    }
}
```

Then after the crowdsale is created, don't forget to approve it to use your tokens!

```solidity
IERC20(tokenAddress).approve(CROWDALE_ADDRESS, SOME_TOKEN_AMOUNT);
```

## Validation

There are a bunch of different validation requirements that your crowdsale might be a part of:

- [CappedCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/CappedCrowdsale.sol) — adds a cap to your crowdsale, invalidating any purchases that would exceed that cap
- [IndividuallyCappedCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol) — caps an individual's contributions.
- [WhitelistedCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/WhitelistedCrowdsale.sol) — only allow whitelisted participants to purchase tokens. this is useful for putting your KYC / AML whitelist on-chain!
- [TimedCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/TimedCrowdsale.sol) — adds an `openingTime` and `closingTime` to your crowdsale

Simply mix and match these crowdsale flavors to your heart's content:

```solidity
contract MyCrowdsale is CappedCrowdsale, TimedCrowdsale, Crowdsale {

    constructor(
        uint256 rate,         // rate, in TKNbits
        address wallet,       // wallet to send Ether
        ERC20 token,          // the token
        uint256 cap,          // total cap, in wei
        uint256 openingTime,  // opening time in unix epoch seconds
        uint256 closingTime   // closing time in unix epoch seconds
    )
        CappedCrowdsale(cap)
        TimedCrowdsale(openingTime, closingTime)
        Crowdsale(rate, wallet, token)
        public
    {
        // nice, we just created a crowdsale that's only open
        // for a certain amount of time
        // and stops accepting contributions once it reaches `cap`
    }
}
```

## Distribution

There comes a time in every crowdsale's life where it must relinquish the tokens it's been entrusted with. It's your decision as to when that happens!

The default behavior is to release tokens as participants purchase them, but sometimes that may not be desirable. For example, what if we want to give users a refund if we don't hit a minimum raised in the sale? Or, maybe we want to wait until after the sale is over before users can claim their tokens and start trading them, perhaps for compliance reasons?

OpenZeppelin is here to make that easy!

### PostDeliveryCrowdsale

The [PostDeliveryCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol), as its name implies, distributes tokens after the crowdsale has finished, letting users call `withdrawTokens()` in order to claim the tokens they've purchased.

```solidity
contract MyCrowdsale is PostDeliveryCrowdsale, TimedCrowdsale, Crowdsale {

    constructor(
        uint256 rate,         // rate, in TKNbits
        address wallet,       // wallet to send Ether
        ERC20 token,          // the token
        uint256 openingTime,  // opening time in unix epoch seconds
        uint256 closingTime   // closing time in unix epoch seconds
    )
        PostDeliveryCrowdsale()
        TimedCrowdsale(startTime, closingTime)
        Crowdsale(rate, wallet, token)
        public
    {
        // nice! this Crowdsale will keep all of the tokens until the end of the crowdsale
        // and then users can `withdrawTokens()` to get the tokens they're owed
    }
}
```

### RefundableCrowdsale

The [RefundableCrowdsale](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/distribution/RefundableCrowdsale.sol) offers to refund users if a minimum goal is not reached. If the goal is not reached, the users can `claimRefund()` to get their Ether back.


```solidity
contract MyCrowdsale is RefundableCrowdsale, Crowdsale {

    constructor(
        uint256 rate,         // rate, in TKNbits
        address wallet,       // wallet to send Ether
        ERC20 token,          // the token
        uint256 goal          // the minimum goal, in wei
    )
        RefundableCrowdsale(goal)
        Crowdsale(rate, wallet, token)
        public
    {
        // nice! this crowdsale will, if it doesn't hit `goal`, allow everyone to get their money back
        // by calling claimRefund(...)
    }
}
```
