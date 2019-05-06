---
id: learn-about-access-control
title: Learn About Access Control
---

Access control—that is, "who is allowed to do this thing"—is incredibly important in the world of smart contracts. The access control of your contract governs who can mint tokens, who can vote on proposals, who can [`selfdestruct()`](https://blog.zeppelin.solutions/on-the-parity-wallet-multisig-hack-405a8c12e8f7) the contract, and more, so it's very important to understand how you implement it.

## Ownership & Ownable.sol

The most common and basic form of access control is the concept of _ownership_: there's one account that is the `owner` and can do administrative tasks on contracts. This approach is perfectly reasonable for contracts that only have a single administrative user.

OpenZeppelin provides [contracts/ownership/Ownable.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) for implementing ownership in your contracts.

```solidity
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MyContract is Ownable {

    function normalThing()
        public
    {
        // anyone can call this normalThing()
    }

    function specialThing()
        public
        onlyOwner
    {
        // only the owner can call specialThing()!
    }
}
```

By default, the `owner` of an `Ownable` contract is the `msg.sender` of the contract creation transaction, which is usually exactly what you want.

Ownable also lets you:
+ `transferOwnership(address newOwner)` to transfer ownership from one account to another
+ `renounceOwnership()` to remove the owner altogether, useful for decentralizing control of your contract. **⚠ Warning!** Removing the owner altogether will mean that administrative tasks that are protected by `onlyOwner` will no longer be callable!


Note that any contract that supports sending transactions can also be the owner of a contract; the only requirement is that the owner has an Ethereum address, so it could be a Gnosis Multisig or Gnosis Safe, an Aragon DAO, an ERC725/uPort identity contract, or a totally custom contract that _you_ create.

In this way you can use _composability_ to add additional layers of access control complexity to your contracts. Instead of having a single Ethereum Off-Chain Account (EOA) as the owner, you can replace them with a 2/3 multisig run by your project leads, for example.

### Examples in OpenZeppelin

You'll notice that none of the OpenZeppelin contracts use Ownable, though! This is because there are more flexible ways of providing access control that are more in-line with our reusable contract philosophy. For most contracts, We'll use `Roles` to govern who can do what. There are some cases, though—like with `Escrow`—where there's a direct relationship between contracts. In those cases, we'll use [`Secondary`](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Secondary.sol) to create a "secondary" contract that allows a "primary" contract to manage it.

Let's learn about Role-Based Access Control!

## Role-Based Access Control & Roles.sol

An alternative to single-concern `Ownable` is role based access control (RBAC), which, instead of keeping track of a single entity with "admin" level privileges, keeps track of multiple different entities with a variety of roles that inform the contract about what they can do.

For example, a `MintableToken` could have a `minter` role that decides who can mint tokens (which could be assigned to a Crowdsale). It could also have a `namer` role that allows changing the name or symbol of the token (for whatever reason). RBAC gives you much more flexibility over who can do what and is generally recommended for applications that need more configurability. If you're experienced with web development, the vast majority of access control systems are role-based: some users are normal users, some are moderators, and some can be company employee admins.

OpenZeppelin provides [contracts/access/Roles.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/access/Roles.sol) for implementing role-based access control.

Here's an example of using `Roles` in our token example above, we'll use it to implement a token that can be minted by `Minters` and renamed by `Namers`:

```solidity
import "openzeppelin-solidity/contracts/access/Roles.sol";

contract MyToken is DetailedERC20, StandardToken {
    using Roles for Roles.Role;

    Roles.Role private minters;
    Roles.Role private namers;

    constructor(
        string name,
        string symbol,
        uint8 decimals,
        address[] minters,
        address[] namers,
    )
        DetailedERC20(name, symbol, decimals)
        Standardtoken()
        public
    {
        namers.addMany(namers);
        minters.addMany(minters);
    }

    function mint(address to, uint256 amount)
        public
    {
        // only allow minters to mint
        require(minters.has(msg.sender), "DOES_NOT_HAVE_MINTER_ROLE");
        _mint(to, amount);
    }

    function rename(string name, string symbol)
        public
    {
        // only allow namers to name
        require(namers.has(msg.sender), "DOES_NOT_HAVE_NAMER_ROLE");
        name = name;
        symbol = symbol;
    }
}
```

So clean! You'll notice that the role associations are always the last arguments in the constructor; this is a good pattern to follow to keep your code more organized.
