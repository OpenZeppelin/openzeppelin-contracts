---
id: tokens
title: Tokens
---

Ah, the "token": the world's most powerful and most misunderstood tool.

A token is a _representation of something in the blockchain_. This something can be money, time, services, shares in a company, a virtual pet, anything. By representing things as tokens, we can allow smart contracts to interact with them, exchange them, create or destroy them.

## But First, ~~Coffee~~ a Primer on Token Contracts

Much of the confusion surrounding tokens comes from two concepts getting mixed up: _token contracts_ and the actual _tokens_.

A _token contract_ is simply an Ethereum smart contract. "Sending tokens" actually means "calling a method on a smart contract that someone wrote and deployed". At the end of the day, a token contract is not much more a mapping of addresses to balances, plus some methods to add and subtract from those balances.

It is these balances that represent the _tokens_ themselves. Someone "has tokens" when their balance in the token contract is non-zero. That's it! These balances could be considered money, experience points in a game, deeds of ownership, or voting rights, and each of these tokens would be stored in different token contracts.

### Different kinds of tokens

Note that there's a big difference between having two voting rights and two deeds of ownership: each vote is equal to all others, but houses usually are not! This is called [fungibility](https://en.wikipedia.org/wiki/Fungibility). _Fungible goods_  are equivalent and interchangeable, like Ether, fiat currencies, and voting rights. _Non-fungible_ goods are unique and distinct, like deeds of ownership, or collectibles.

In a nutshell, when dealing with non-fungibles (like your house) you care about _which ones_ you have, while in fungible assets (like your bank account statement) what matters is _how much_ you have.

### Standards

Even though the concept of a token is simple, they have a variety of complexities in the implementation. Because everything in Ethereum is just a smart contract, and there are no rules about what smart contracts have to do, the community has developed a variety of **standards** (called EIPs or ERCs) for documenting how a contract can interoperate with other contracts.

You've probably heard of the [ERC20](#erc20) or [ERC721](#erc721) token standards, and that's why you're here.


## ERC20

An ERC20 token contract keeps track of [_fungible_ tokens](#different-kinds-of-tokens): any one token is exactly equal to any other token; no tokens have special rights or behavior associated with them. This makes ERC20 tokens useful for things like a **medium of exchange currency**, **voting rights**, **staking**, and more.

OpenZeppelin provides many ERC20-related contracts. On the [`API reference`](api/token/ERC20) you'll find detailed information on their properties and usage.

### Constructing an ERC20 Token Contract

Using OpenZeppelin, we can easily create our own ERC20 token contract, which will be used to track _Gold_ (GLD), an internal currency in a hypothetical game.

Here's what our GLD token might look like.

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract GLDToken is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply) ERC20Detailed("Gold", "GLD", 18) public {
        _mint(msg.sender, initialSupply);
    }
}
```

OpenZeppelin contracts are often used via [inheritance](https://solidity.readthedocs.io/en/latest/contracts.html#inheritance), and here we're reusing [`ERC20`](api/token/ERC20#erc20) for the basic standard implementation and [`ERC20Detailed`](api/token/ERC20#erc20detailed) to get the [`name`](api/token/ERC20#ERC20Detailed.name()), [`symbol`](api/token/ERC20#ERC20Detailed.symbol()), and [`decimals`](api/token/ERC20#ERC20Detailed.decimals()) properties. Additionally, we're creating an `initialSupply` of tokens, which will be assigned to the address that deploys the contract.

_For a more complete discussion of ERC20 supply mechanisms, see [our advanced guide](erc20-supply)_.

That's it! Once deployed, we will be able to query the deployer's balance:

```javascript
> GLDToken.balanceOf(deployerAddress)
1000
```

We can also [transfer](api/token/ERC20#IERC20.transfer(address,uint256)) these tokens to other accounts:

```javascript
> GLDToken.transfer(otherAddress, 300)
> GLDToken.balanceOf(otherAddress)
300
> GLDToken.balanceOf(deployerAddress)
700
```

### A note on `decimals`

Often, you'll want to be able to divide your tokens into arbitrary amounts: say, if you own `5 GLD`, you may want to send `1.5 GLD` to a friend, and keep `3.5 GLD` to yourself. Unfortunately, Solidity and the EVM do not support this behavior: only integer (whole) numbers can be used, which poses an issue. You may send `1` or `2` tokens, but not `1.5`.

To work around this, [`ERC20Detailed`](api/token/ERC20#erc20detailed) provides a [`decimals`](api/token/ERC20#ERC20Detailed.decimals()) field, which is used to specify how many decimal places a token has. To be able to transfer `1.5 GLD`, `decimals` must be at least `1`, since that number has a single decimal place.

How can this be achieved? It's actually very simple: a token contract can use larger integer values, so that a balance of `50` will represent `5 GLD`, a transfer of `15` will correspond to `1.5 GLD` being sent, and so on.

It is important to understand that `decimals` is _only used for display purposes_. All arithmetic inside the contract is still performed on integers, and it is the different user interfaces (wallets, exchanges, etc.) that must adjust the displayed values according to `decimals`. The total token supply and balance of each account are not specified in `GLD`: you need to divide by `10**decimals` to get the actual `GLD` amount.

You'll probably want to use a `decimals` value of `18`, just like Ether and most ERC20 token contracts in use, unless you have a very special reason not to. When minting tokens or transferring them around, you will be actually sending the number `num GLD * 10**decimals`. So if you want to send `5` tokens using a token contract with 18 decimals, the the method to call will actually be `transfer(recipient, 5 * 10**18)`.


## ERC721

We've discussed how you can make a _fungible_ token using [ERC20](#erc20), but what if not all tokens are alike? This comes up in situations like **real estate** or **collectibles**, where some items are valued more than others, due to their usefulness, rarity, etc. ERC721 is a standard for representing ownership of [_non-fungible_ tokens](#different-kinds-of-tokens), that is, where each token is unique.

ERC721 is a more complex standard than ERC20, with multiple optional extensions, and is split accross a number of contracts. OpenZeppelin provides flexibility regarding how these are combined, along with custom useful extensions. Check out the [`API reference`](api/token/ERC721) to learn more about these.

### Constructing an ERC721 Token Contract

We'll use ERC721 to track items in our game, which will each have their own unique attributes. Whenever one is to be awarded to a player, it will be minted and sent to them. Players are free to keep their token or trade it with other people as they see fit, as they would any other asset on the blockchain!

Here's what a contract for tokenized items might look like:

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "openzeppelin-solidity/contracts/drafts/Counters.sol";

contract GameItem is ERC721Full {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721Full("GameItem", "ITM") public {
    }

    function awardItem(address player, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
```

The [`ERC721Full`](api/token/ERC721#erc721full) contract includes all standard extensions, and is probably the one you want to use. In particular, it includes [`ERC721Metadata`](api/token/ERC721#erc721metadata), which provides the [`_setTokenURI`](api/token/ERC721#ERC721Metadata._setTokenURI(uint256,string)) method we use to store an item's metadata.

Also note that, unlike ERC20, ERC721 lacks a `decimals` field, since each token is distinct and cannot be partitioned.

New items can be created:

```javascript
> gameItem.awardItem(playerAddress, "https://game.example/item-id-8u5h2m.json")
7
```

And the owner and metadata of each item queried:
```javascript
> gameItem.ownerOf(7)
playerAddress
> gameItem.tokenURI(7)
"https://game.example/item-id-8u5h2m.json"
```

This `tokenURI` should resolve to a JSON document that might look something like:

```json
{
    "name": "Thor's hammer",
    "description": "Mjölnir, the legendary hammer of the Norse god of thunder.",
    "image": "https://game.example/item-id-8u5h2m.png",
    "strength": 20
}
```

For more information about the `tokenURI` metadata JSON Schema, check out the [ERC721 specification](https://eips.ethereum.org/EIPS/eip-721).

_Note: you'll notice that the item's information is included in the metadata, but that information isn't on-chain! So a game developer could change the underlying metadata, changing the rules of the game! If you'd like to put all item information on-chain, you can extend ERC721 to do so (though it will be rather costly). You could also leverage IPFS to store the tokenURI information, but these techniques are out of the scope of this overview guide._


# Advanced standards

[ERC20](#erc20) and [ERC721](#erc721) (fungible and non-fungible assets, respectively) are the first two token contract standards to enjoy widespread use and adoption, but over time, multiple weak points of these standards were identified, as more advanced use cases came up.

As a result, a multitude of new token standards were and are still being developed, with different tradeoffs between complexity, compatibility and ease of use. We'll explore some of those here.

## ERC777

Like ERC20, ERC777 is a standard for [_fungible_ tokens](#different-kinds-of-tokens), and is focused around allowing more complex interactions when trading tokens. More generally, it brings tokens and Ether closer together by providing the equivalent of a `msg.value` field, but for tokens.

The standard also bring multiple quality-of-life improvements, such as getting rid of the confusion around `decimals`, minting and burning with proper events, among others, but its killer feature are **receive hooks**. A hook is simply a function in a contract that is called when tokens are sent to it, meaning **accounts and contracts can react to receiving tokens**.

This enables a lot of interesting use cases, including atomic purchases using tokens (no need to do `approve` and `transferFrom` in two separate transactions), rejecting reception of tokens (by reverting on the hook call), redirecting the received tokens to other addresses (similarly to how [`PaymentSplitter`](api/payment#paymentsplitter) does it), among many others.

Furthermore, since contracts are required to implement these hooks in order to receive tokens, _no tokens can get stuck in a contract that is unaware of the ERC777 protocol_, as has happened countless times when using ERC20s.

### What if I already use ERC20?
The standard has you covered! The ERC777 standard is **backwards compatible with ERC20**, meaning you can interact with these tokens as if they were ERC20, using the standard functions, while still getting all of the niceties, including send hooks. See the [EIP's Backwards Compatibility section](https://eips.ethereum.org/EIPS/eip-777#backward-compatibility) to learn more.

### Constructing an ERC777 Token Contract

We will replicate the `GLD` example of the [ERC20 guide](#constructing-an-erc20-token-contract), this time using ERC777. As always, check out the [`API reference`](api/token/ERC777) to learn more about the details of each function.

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";

contract GLDToken is ERC777 {
    constructor(
        uint256 initialSupply,
        address[] memory defaultOperators
    )
        ERC777("Gold", "GLD", defaultOperators)
        public
    {
        _mint(msg.sender, msg.sender, initialSupply, "", "");
    }
}```

In this case, we'll be extending from the [`ERC777`](api/token/ERC777#erc777) contract, which provides an implementation with compatibility support for ERC20. The API is quite similar to that of [`ERC777`](api/token/ERC777#erc777), and we'll once again make use of [`_mint`](api/token/ERC777#ERC777._mint(address,address,uint256,bytes,bytes)) to assign the `initialSupply` to the deployer account. Unlike [ERC20's `_mint`](api/token/ERC20#ERC20._mint(address,uint256)), this one includes some extra parameters, but you can safely ignore those for now.

You'll notice both [`name`](api/token/ERC777#IERC777.name()) and [`symbol`](api/token/ERC777#IERC777.symbol()) are assigned, but not [`decimals`](api/token/ERC777#ERC777.decimals()). The ERC777 specification makes it mandatory to include support for these functions (unlike ERC20, where it is optional and we had to include [`ERC20Detailed`](api/token/ERC20#erc20detailed)), but also mandates that `decimals` always returns a fixed value of `18`, so there's no need to set it ourselves. For a review of `decimals`'s role and importance, refer back to our [ERC20 guide](tokens#a-note-on-decimals).

Finally, we'll need to set the [`defaultOperators`](api/token/ERC777#IERC777.defaultOperators()): special accounts (usually other smart contracts) that will be able to transfer tokens on behalf of their holders. If you're not planning on using operators in your token, you can simply pass an empty array. _Stay tuned for an upcoming in-depth guide on ERC777 operators!_

That's it for a basic token contract! We can now deploy it, and use the same [`balanceOf`](api/token/ERC777#IERC777.balanceOf(address)) method to query the deployer's balance:

```javascript
> GLDToken.balanceOf(deployerAddress)
1000
```

To move tokens from one account to another, we can use both [`ERC20`'s `transfer`](api/token/ERC777#ERC777.transfer(address,uint256)) method, or the new [`ERC777`'s `send`](api/token/ERC777#ERC777.send(address,uint256,bytes)), which fulfills a very similar role, but adds an optional `data` field:

```javascript
> GLDToken.transfer(otherAddress, 300)
> GLDToken.send(otherAddress, 300, "")
> GLDToken.balanceOf(otherAddress)
600
> GLDToken.balanceOf(deployerAddress)
400
```


### Contract recipients

A key difference when using [`send`](api/token/ERC777#ERC777.send(address,uint256,bytes)) is that token transfers to other contracts may revert with the following message:

```text
ERC777: token recipient contract has no implementer for ERC777TokensRecipient
```

This is a good thing! It means that the recipient contract has not registered itself as aware of the ERC777 protocol, so transfers to it are disabled to **prevent tokens from being locked forever**. As an example, [the Golem contract currently holds over 350k `GNT` tokens](https://etherscan.io/token/0xa74476443119A942dE498590Fe1f2454d7D4aC0d?a=0xa74476443119A942dE498590Fe1f2454d7D4aC0d), worth multiple tens of thousands of dollars, and lacks methods to get them out of there. This has happened to virtually every ERC20-backed project, usually due to user error.

_An upcoming guide will cover how a contract can register itself as a recipient, send and receive hooks, and other advanced features of ERC777!_
