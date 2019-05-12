---
id: learn-about-tokens
title: Learn About Tokens
---

Ah, the "token": the world's most powerful and most misused tool. In this section we'll learn to harness the power of native units of account for good and world peace!

## But First, ~~Coffee~~ a Primer on Tokens

Simply put, a token _isn't anything special_. In Ethereum, pretty much _everything_ is a contract, and that includes what we call tokens. "Sending a token" is the same as "calling a method on a smart contract that someone wrote and deployed". And, at the end of the day, a token is just a mapping of addresses to balances and some nice methods to add and subtract from those balances.

That's it! These balances could be considered money, or they could be voting rights or they could be experience points in your game.

Even though the concept of a token is simple, they have a variety of complexities in the implementation. Because everything in Ethereum is just a smart contract, and there are no rules about what smart contracts have to do, the community has developed a variety of **standards** (called EIPs or ERCs) for documenting how a contract can interoperate with other contracts.

You've probably heard of the **ERC20** standard, and that's why you're here.

## ERC20

An ERC20 token is a contract that keeps track of a `mapping(address => uint256)` that represents a user's balance. These tokens are _fungible_ in that any one token is exactly equal to any other token; no tokens have special rights or behavior associated with them. This makes ERC20 useful for things like a medium of exchange currency, general voting rights, staking, and more.

OpenZeppelin provides a few different ERC20-related contracts. Here are the core contracts you'll almost definitely be using:

- [IERC20](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/IERC20.sol) — defines the interface that all ERC20 token implementations should conform to
- [ERC20](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol) — the base implementation of the ERC20 interface
- [ERC20Detailed](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Detailed.sol) — the `name()`, `symbol()`, and `decimals()` getters are optional in the original standard, so `ERC20Detailed` adds that information to your token.


After that, OpenZeppelin provides a few extra properties that you may want depending on your use-case:

- [ERC20Mintable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Mintable.sol) — `ERC20Mintable` allows users with the [`MinterRole`](/api/docs/learn-about-access-control.html) to call the `mint()` function and mint tokens to users. Minting can also be finished, locking the `mint()` function's behavior.
- [ERC20Burnable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Burnable.sol) — if your token can be burned (aka, it can be destroyed), include this one
- [ERC20Capped](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Capped.sol) — `ERC20Capped` is a type of `ERC20Mintable` that enforces a maximum cap on tokens; this is really useful if you want to ensure network participants that there will always be a maximum number of tokens, and is useful for making sure that multiple different minting methods don't accidentally create more tokens than you expected.
- [ERC20Pausable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Pausable.sol) — `ERC20Pausable` allows anyone with the Pauser role to pause the token, freezing transfers to and from users. This is useful if you want to stop trades until the end of a crowdsale, or if you want to have an emergency switch for freezing your tokens in the event of a large bug. Note that there are inherent decentralization tradeoffs when using a pausable token; users may not expect that their unstoppable money can be frozen by a single address!

Finally, if you're working with ERC20 tokens, OpenZeppelin provides some utility contracts:

- [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/SafeERC20.sol) — provides `safeTransfer`, `safeTransferFrom`, and `safeApprove` that are helpful wrappers around the normal ERC20 functions. Using `SafeERC20` forces transfers and approvals to succeed, or the entire transaction is reverted.
- [TokenTimelock](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/TokenTimelock.sol) — is an escrow contract for ERC20 tokens that will release some tokens after a specified timeout. This is useful for simple vesting schedules like "advisors get all of their tokens after 1 year". For a better vesting schedule, though, see [`TokenVesting`](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/drafts/TokenVesting.sol)

### Constructing a Nice ERC20 Token

Now that we know what all of the contracts do (you should read the code! It's open source!), we can make our ERC20 token that will revolutionize dogsitting by reducing human beings to organic machines that act entirely based on rational monetary incentives, fueled by the DOGGO token.

Here's what a good DOGGO token might look like.

```solidity
contract DoggoToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    )
        ERC20Burnable()
        ERC20Mintable()
        ERC20Detailed(name, symbol, decimals)
        ERC20()
        public
    {}
}
```

`ERC20Mintable` allows to add minters via `addMinter(addr)`, so they (like the DOGGO Network multisig) can mint tokens to the dogsitters in exchange for watching the nice doggos while their owners leave for vacation. The token is `ERC20Burnable` we want to have the ability to stake DOGGO tokens on our reputation—if the dogsitter does a bad job, their tokens get burned!

### A Note on `decimals`

You might remember from the previous chapter about crowdsales about how math is performed in financial situations: **all currency math is done in the smallest unit of that currency**.

That means that the `totalSupply` of a token is actually in what we call `TKNbits`, not what you see as `TKN`. So if my total supply is `1` and we have `5` decimals in the token, that's actually `1 TKNbit` and will be displayed as `0.00001 TKN`.

You probably want to use a decimals of `18`, just like Ether, unless you have a special reason not to, so when you're minting tokens to people or transferring them around, you're actually sending the number `numTKN * 10^(decimals)`. So if I'm sending you `5` tokens using a token contract with 18 decimals, the method I'm executing actually looks like `transfer(yourAddress, 5 * 10^18)`.

## ERC721

We've discussed how you can make a _fungible_ token using ERC20, but what if not all tokens are alike? This comes up in situations like company stock; some stock is common stock and some stock is investor shares, etc. It also comes up in a bunch of other places like in-game items, time, property, and so on.

[ERC721](https://eips.ethereum.org/EIPS/eip-721) is a standard for representing ownership that is **non-fungible** aka, each token has unique properties.

Let's see what contracts OpenZeppelin provides for helping us work with ERC721:

- The `IERC721`, `IERC721Metadata`, `IERC721Enumerable` interfaces are part of the [IERC721.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/IERC721.sol) file, which document the interfaces.
- [ERC721](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/ERC721.sol) — is the full implementation of ERC721, and the contract you'll most likely be inheriting from.
- [IERC721Receiver](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/IERC721Receiver.sol) — in some cases, it's beneficial to be 100% certain that a contract knows how to handle ERC721 tokens (imagine sending an in-game item to an exchange address that can't send it back!). When using `safeTransferFrom()`, the contract checks to see that the receiver is an `IERC721Receiver`, which implies that it knows how to handle ERC721 tokens. If you're writing a contract that accepts 721 tokens, you'll want to implement this interface.
- [ERC721Mintable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/ERC721Mintable.sol) — like the ERC20 version, ERC721Mintable allows addresses with the `Minter` role to mint tokens.
- [ERC721Pausable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC721/ERC721Pausable.sol) — like the ERC20 version, ERC721Pausable allows addresses with the `Pauser` role to freeze transfers of tokens.


We'll use these contracts to tokenize the time of our dogsitters: when a dogsitter wants to sell an hour of their time to watch a dog, they can mint an ERC721 token that represents that hour slot and then sell this token on an exchange. Then they'll go to the owner's house at the right time to watch their doggos.

Here's what tokenized dogsitter timeframes might look like:

```solidity
contract DoggoTime is ERC721Full {
    using Counters for Counters.Counter;
    Counters.Counter private tokenId;

    constructor(
        string memory name,
        string memory symbol
    )
        ERC721Full(name, symbol)
        public
    {}

    function createDoggoTimeframe(
        string memory tokenURI
    )
        public
        returns (bool)
    {
        tokenId.increment();
        uint256 doggoTokenId = tokenId.current();
        _mint(msg.sender, doggoTokenId);
        _setTokenURI(doggoTokenId, tokenURI);
        return true;
    }
}```

Now anyone who wants to sell their time in exchange for DOGGO tokens can call:

```solidity
DoggoTime(doggoTimeAddress).createDoggoTimeframe("https://example.com/doggo.json")
```

where the tokenURI should resolve to a json document that might look something like:

```json
{
    "name": "Alex's DOGGO Dogsitting Time — 1 Hour on Thursday the 5th at 6pm",
    "description": "Alex agrees to dog sit for 1 hour of her time on Thursday the 5th at 6pm.",
    "image": "https://example.com/doggo-network.png"
}
```

For more information about tokenURI metadata, check out the [finalized ERC721 spec](https://eips.ethereum.org/EIPS/eip-721).

_Note: you'll also notice that the date information is included in the metadata, but that information isn't on-chain! So Alex the dogsitter could change the time and scam some people out of their money! If you'd like to put the dates of the dogsitting hours on-chain, you can extend ERC721 to do so. You could also leverage IPFS to pin the tokenURI information, which lets viewers know if Alex has changed the metadata associated with her tokens, but these techniques are out of the scope of this overview guide._
