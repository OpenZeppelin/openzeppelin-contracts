# <img src="logo.png" alt="OpenZeppelin" height="40px">

## OpenZeppelin Contracts Ethereum Package

[![NPM Package](https://img.shields.io/npm/v/openzeppelin-contracts-ethereum-package.svg)](https://www.npmjs.org/package/@openzeppelin/contracts-ethereum-package)
[![Build Status](https://circleci.com/gh/OpenZeppelin/openzeppelin-contracts-ethereum-package.svg?style=shield)](https://circleci.com/gh/OpenZeppelin/openzeppelin-contracts-ethereum-package)

**OpenZeppelin Contracts is a library for secure smart contract development.** It provides implementations of standards like ERC20 and ERC721 which you can deploy as-is or extend to suit your needs, as well as Solidity components to build custom contracts and more complex decentralized systems.

This fork of OpenZeppelin is set up as a **reusable Ethereum Package**. It is deployed to the kovan, rinkeby, and ropsten test networks, as well as to the main Ethereum network. You can reuse any of the pre-deployed on-chain contracts by simply linking to them using the [OpenZeppelin SDK](https://github.com/openzeppelin/openzeppelin-sdk), or reuse their Solidity source code as with the [vanilla version of OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts).

## Differences with openzeppelin-contracts

This package contains the same contracts as the vanilla [openzeppelin-contracts](https://github.com/openZeppelin/openzeppelin-contracts). The main difference is that _all contracts in this package are potentially upgradeable_: you will notice that no contracts have constructors defined, but use [initializer functions](https://docs.zeppelinos.org/docs/writing_contracts.html#initializers) instead. Also, this package is set up as an Ethereum package, and provides a small set of pre-deployed logic contracts that can be used directly via the OpenZeppelin SDK, without needing to deploy them again.

All in all, **you should use this package instead of openzeppelin-solidity if you are managing your project via the OpenZeppelin CLI**.

## Install

```
npm install @openzeppelin/contracts-ethereum-package
```

## Deployed logic contracts

- [StandaloneERC20](contracts/token/ERC20/StandaloneERC20.sol): ERC20 token implementation, optionally mintable and pausable.
- [StandaloneERC721](contracts/token/ERC721/StandaloneERC721.sol): ERC721 non-fungible token implementation with metadata and enumerable extensions, optionally mintable and pausable.
- [TokenVesting](contracts/drafts/TokenVesting.sol): tToken holder contract that can release its token balance gradually like a typical vesting scheme, with a cliff and vesting period, optionally revocable.
- [PaymentSplitter](contracts/payment/PaymentSplitter.sol): Splits payments among a group of addresses proportionately to some number of shares they own.

## Using via the OpenZeppelin CLI

You can easily create upgradeable instances of any of the logic contracts listed above using the OpenZeppelin CLI. This will rely on the pre-deployed instances in mainnet, kovan, ropsten, or rinkeby, greatly reducing your gas deployment costs. To do this, just [create a new OpenZeppelin SDK project](https://docs.zeppelinos.org/docs/deploying.html) and [link to this package](https://docs.zeppelinos.org/docs/linking.html).

```bash
$ npm install -g @openzeppelin/cli
$ openzeppelin init
$ openzeppelin link @openzeppelin/contracts-ethereum-package
> Installing...
$ openzeppelin create @openzeppelin/contracts-ethereum-package/StandaloneERC20
> Creating...
```

To create an instance of a contract, use the `openzeppelin create` command. As an example, you can run the following to create an upgradeable ERC20 named MyToken, with symbol TKN and 8 decimals, and an initial supply of 100 tokens assigned to the address HOLDER, with a MINTER and a PAUSER. Remember to replace $HOLDER, $MINTER, and $PAUSER with actual addresses when you run this command; you can specify more than one (or none at all) minters and pausers.

```
$ openzeppelin create
? Pick a contract to instantiate: @openzeppelin/contracts-ethereum-package/StandaloneERC20
? Pick a network: development
✓ Deploying @openzeppelin/contracts-ethereum-package dependency to network
? Do you want to call a function on the instance after creating it?: Yes
? Select which function: * initialize(name: string, symbol: string, decimals: uint8, initialSupply: uint256, initialHolder: address, minters: address[], pausers: address[])
? name (string): MyToken
? symbol (string): MYT
? decimals (uint8): 18
? initialSupply (uint256): 100e18
? initialHolder (address): 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
? minters (address[]):
? pausers (address[]):
✓ Setting everything up to create contract instances
✓ Instance created at 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
```

OpenZeppelin will create an upgradeable ERC20 instance and keep track of its address in the `.openzeppelin/rinkeby.json` file. Should you update your version of the openzeppelin contracts ethereum package later down the road, you can simply run `openzeppelin update` to upgrade all your ERC20 instances to the latest version.

You can also deploy a ERC721 token by choosing the `StandaloneERC721` contract when running `openzeppelin create`. Refer to the `initialize` function of each of the predeployed logic contracts to see which parameters are required for initialization.

## Extending contracts

If you prefer to write your custom contracts, import the ones from this package and extend them through inheritance. Note that **you must use this package and not `@openzeppelin/contracts` if you are [writing upgradeable contracts](https://docs.zeppelinos.org/docs/writing_contracts.html)**.

```solidity
pragma solidity ^0.5.0;

import '@openzeppelin/upgrades/contracts/Initializable.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Full.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Mintable.sol';

contract MyNFT is Initializable, ERC721Full, ERC721Mintable {
  function initialize() public initializer {
    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize("MyNFT", "MNFT");
    ERC721Mintable.initialize(msg.sender);
  }
}
```

On our site you will find a few [guides] to learn about the different parts of OpenZeppelin, as well as [documentation for the API][API docs]. Keep in mind that the API docs are work in progress, and don’t hesitate to ask questions in [our forum][forum].

## Security

OpenZeppelin Contracts is maintained by [OpenZeppelin](https://openzeppelin.com) the company, and developed following our high standards for code quality and security. OpenZeppelin Contracts is meant to provide tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problems you might experience.

The core development principles and strategies that OpenZeppelin Contracts is based on include: security in depth, simple and modular code, clarity-driven naming conventions, comprehensive unit testing, pre-and-post-condition sanity checks, code consistency, and regular audits.

The latest audit was done on October 2018 on version 2.0.0.

Please report any security issues you find to security@openzeppelin.org.

## Contribute

OpenZeppelin exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## License

OpenZeppelin is released under the [MIT License](LICENSE).

[API docs]: https://docs.openzeppelin.org/v2.3.0/api/token/erc20
[guides]: https://docs.openzeppelin.org/v2.3.0/get-started
[forum]: https://forum.zeppelin.solutions
[contribution guide]: CONTRIBUTING.md
