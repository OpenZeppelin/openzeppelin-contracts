---
id: access-control
title: Access Control
---
Access control — that is, "who is allowed to do this thing" — is incredibly important in the world of smart contracts. The access control of your contract may govern who can mint tokens, vote on proposals, freeze transfers, and many others. It is therefore critical to understand how you implement it, lest someone else [steals your whole system](https://blog.zeppelin.solutions/on-the-parity-wallet-multisig-hack-405a8c12e8f7).

## Ownership and `Ownable`

The most common and basic form of access control is the concept of _ownership_: there's an account that is the `owner` of a contract and can do administrative tasks on it. This approach is perfectly reasonable for contracts that have a single administrative user.

OpenZeppelin provides [`Ownable`](api/ownership#ownable) for implementing ownership in your contracts.

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MyContract is Ownable {
    function normalThing() public {
        // anyone can call this normalThing()
    }

    function specialThing() public onlyOwner {
        // only the owner can call specialThing()!
    }
}
```

By default, the [`owner`](api/ownership#Ownable.owner()) of an `Ownable` contract is the account that deployed it, which is usually exactly what you want.

Ownable also lets you:
- [`transferOwnership`](api/ownership#Ownable.transferOwnership(address)) from the owner account to a new one
- [`renounceOwnership`](api/ownership#Ownable.renounceOwnership()) for the owner to lose this administrative privilege, a common pattern after an initial stage with centralized administration is over
  - **⚠ Warning! ⚠** Removing the owner altogether will mean that administrative tasks that are protected by `onlyOwner` will no longer be callable!

Note that **a contract can also be the owner of another one**! This opens the door to using, for example, a [Gnosis Multisig](https://github.com/gnosis/MultiSigWallet) or [Gnosis Safe](https://safe.gnosis.io), an [Aragon DAO](https://aragon.org), an [ERC725/uPort](https://www.uport.me) identity contract, or a totally custom contract that _you_ create.

In this way you can use _composability_ to add additional layers of access control complexity to your contracts. Instead of having a single regular Ethereum account (Externally Owned Account, or EOA) as the owner, you could use a 2-of-3 multisig run by your project leads, for example. Prominent projects in the space, such as [MakerDAO](https://makerdao.com), use systems similar to this one.

## Role-Based Access Control

While the simplicity of _ownership_ can be useful for simple systems or quick prototyping, different levels of authorization are often needed. An account may be able to ban users from a system, but not create new tokens, etc. _Role-Based Access Control (RBAC)_ offers flexibility in this regard.

In essence, we will be defining multiple _roles_, each with their own specific permissions (so instead of _roles_onlyOwner_ you can implement _onlyAdminRole_, _onlyModeratorRole_, etc.) and rules for how accounts can be assignned the role, transfer it, and more.

Most of software development uses access control systems that are role-based: some users are regular users, some may be supervisors or managers, and a few will often have administrative privileges.

### Using `Roles`

OpenZeppelin provides [`Roles`](api/access#roles) for implementing role-based access control. Its usage is straightforward: for each role (often associated with permissions) that you want to define, you'll store a  variable of type `Role`, which will hold the list of accounts with that role.

Here's an simple example of using `Roles` in an [`ERC20` token](tokens#erc20): we'll define two roles, `namers` and `minters`, that will be able to change the name of the token contract, and mint new tokens, respectively.

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract MyToken is ERC20, ERC20Detailed {
    using Roles for Roles.Role;

    Roles.Role private _minters;
    Roles.Role private _namers;

    constructor(address[] memory minters, address[] memory namers)
        DetailedERC20("MyToken", "MTKN", 18)
        public
    {
        for (uint256 i = 0; i < minters.length; ++i) {
            _minters.add(minters[i]);
        }

        for (uint256 i = 0; i < namers.length; ++i) {
            _namers.add(namers[i]);
        }
    }

    function mint(address to, uint256 amount) public {
        // Only minters can mint
        require(minters.has(msg.sender), "DOES_NOT_HAVE_MINTER_ROLE");

        _mint(to, amount);
    }

    function rename(string memory name, string memory symbol) public {
        // Only namers can change the name and symbol
        require(namers.has(msg.sender), "DOES_NOT_HAVE_NAMER_ROLE");

        name = name;
        symbol = symbol;
    }
}
```

So clean! By splitting concerns this way, we can define more granular levels of permission, which was lacking in the _ownership_ approach to access control. Note that an account may have more than one role, if desired.

OpenZeppelin uses `Roles` extensively with predefined contracts that encode rules for each specific role: [`ERC20Mintable`](api/token/ERC20#erc20mintable) uses the [`MinterRole`](api/access#minterrole) to determine who can mint tokens, [`WhitelistCrowdsale`](api/crowdsale#whitelistcrowdsale) uses both [`WhitelistAdminRole`](api/access#whitelistadminrole) and [`WhitelistedRole`](api/access#whitelistedrole) to create a set of accounts that can purchase tokens, etc.

This flexibility allows for interesting setups: for example, a [`MintedCrowdsale`](api/crowdsale#mintedcrowdsale) expects to be given the `MinterRole` of an `ERC20Mintable` in order to work, but the token contract could also extend [`ERC20Pausable`](api/token/ERC20#erc20pausable) and assign the [`PauserRole`](api/access#pauserrole) to a DAO that serves as a contingency mechanism in case e.g. a vulnerability is discovered in the contract code. Limiting what each component of a system is able to do is usually a good idea.

## Usage in OpenZeppelin

You'll notice that none of the OpenZeppelin contracts use `Ownable` - `Roles` is a prefferred solution, because it provides the user of the library with enough flexibility to adapt the provided contracts to their needs.

There are some cases, though, where there's a direct relationship between contracts. For example, [`RefundableCrowdsale`](api/crowdsale#refundablecrowdsale) deploys a [`RefundEscrow`](api/payment#refundescrow) on construction, to hold its funds. For those cases, we'll use [`Secondary`](api/ownership#secondary) to create a _secondary_ contract that allows a _primary_ contract to manage it. You could also think of these as _auxiliary_ contracts.
