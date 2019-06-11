# <img src="logo.png" alt="OpenZeppelin" width="400px">

# OpenZeppelin EVM Package

[![NPM Package](https://img.shields.io/npm/v/openzeppelin-eth.svg?style=flat-square)](https://www.npmjs.org/package/openzeppelin-eth)
[![Build Status](https://img.shields.io/travis/OpenZeppelin/openzeppelin-eth.svg?branch=master&style=flat-square)](https://travis-ci.org/OpenZeppelin/openzeppelin-eth)

**OpenZeppelin is a library for secure smart contract development.** It provides implementations of standards like ERC20 and ERC721 which you can deploy as-is or extend to suit your needs, as well as Solidity components to build custom contracts and more complex decentralized systems.

This fork of OpenZeppelin is set up as a **reusable EVM Package**. It is deployed to the kovan, rinkeby, and ropsten test networks, as well as to the main Ethereum network. You can reuse any of the pre-deployed on-chain contracts by simply linking to them using [ZeppelinOS](https://github.com/zeppelinos/zos), or reuse their Solidity source code as with the [vanilla version of OpenZeppelin](https://github.com/openZeppelin/Openzeppelin-solidity).

## Differences with OpenZeppelin-Solidity

This package contains the same contracts as the vanilla [OpenZeppelin-Solidity](https://github.com/openZeppelin/Openzeppelin-solidity). The main difference is that _all contracts in this package are potentially upgradeable_: you will notice that no contracts have constructors defined, but use [initializer functions](https://docs.zeppelinos.org/docs/writing_contracts.html#initializers) instead. Also, this package is set up as an EVM package, and provides a small set of pre-deployed logic contracts that can be used directly via ZeppelinOS, without needing to deploy them again.

All in all, **you should use this package instead of openzeppelin-solidity if you are managing your project via ZeppelinOS**.

## Install

```
npm install openzeppelin-eth
```

## Deployed logic contracts

- [StandaloneERC20](contracts/token/ERC20/StandaloneERC20.sol): ERC20 token implementation, optionally mintable and pausable.
- [StandaloneERC721](contracts/token/ERC721/StandaloneERC721.sol): ERC721 non-fungible token implementation with metadata and enumerable extensions, optionally mintable and pausable.
- [TokenVesting](contracts/drafts/TokenVesting.sol): tToken holder contract that can release its token balance gradually like a typical vesting scheme, with a cliff and vesting period, optionally revocable.
- [PaymentSplitter](contracts/payment/PaymentSplitter.sol): Splits payments among a group of addresses proportionately to some number of shares they own.

## Using via ZeppelinOS

You can easily create upgradeable instances of any of the logic contracts listed above using ZeppelinOS. This will rely on the pre-deployed instances in mainnet, kovan, ropsten, or rinkeby, greatly reducing your gas deployment costs. To do this, just [create a new ZeppelinOS project](https://docs.zeppelinos.org/docs/deploying.html) and [link to this package](https://docs.zeppelinos.org/docs/linking.html).

```bash
$ npm install -g zos
$ zos init YourProject
$ zos link openzeppelin-eth
> Installing openzeppelin-eth
$ zos push --network rinkeby
> Connecting to dependency openzeppelin-eth
```

> In case you are working in a private or development network where openzeppelin-eth has not been pre-deployed (such as ganache), you need to instruct ZeppelinOS to deploy the package there with an additional flag: `zos push --deploy-dependencies --network local`.

To create an instance of a contract, use the `zos create` command. As an example, you can run the following to create an upgradeable ERC20 named MyToken, with symbol TKN and 8 decimals, and an initial supply of 100 tokens assigned to the address HOLDER, with a MINTER and a PAUSER. Remember to replace $HOLDER, $MINTER, and $PAUSER with actual addresses when you run this command; you can specify more than one (or none at all) minters and pausers.

```
$ zos create openzeppelin-eth/StandaloneERC20 --init --args="MyToken,TKN,8,10000000000,$HOLDER,[$MINTER],[$PAUSER]" --network rinkeby
> Creating proxy to logic contract and initializing by calling initialize with: 
 - name (string): "MyToken"
 - symbol (string): "TKN"
 - decimals (uint8): "8"
 - initialSupply (uint256): "10000000000"
 - initialHolder (address): "$HOLDER"
 - minters (address[]): ["$MINTER"]
 - pausers (address[]): ["$PAUSER"]
Instance created at 0x...
```

ZeppelinOS will create an upgradeable ERC20 instance and keep track of its address in the `zos.rinkeby.json` file. Should you update your version of openzeppelin-eth later down the road, you can simply run `zos update openzeppelin-eth/StandaloneERC20` to upgrade all your ERC20 instances to the latest version.

If you want to deploy an ERC721 non-fungible token instead, you can use the following command.
```
$ zos create openzeppelin-eth/StandaloneERC721 --init --args="MyToken,TKN,[$MINTER],[$PAUSER]" --network rinkeby
> Creating proxy to logic contract and initializing by calling initialize with: 
 - name (string): "MyToken"
 - symbol (string): "TKN"
 - minters (address[]): ["$MINTER"]
 - pausers (address[]): ["$PAUSER"]
Instance created at 0x...
```

Refer to the `initialize` function of each of the predeployed logic contracts to see which parameters are required for initialization.

## Extending contracts

If you prefer to write your custom contracts, import the ones from `openzeppelin-eth` and extend them through inheritance. Note that **you must use this package and not `openzeppelin-solidity` if you are [writing upgradeable contracts](https://docs.zeppelinos.org/docs/writing_contracts.html)**.

```solidity
pragma solidity ^0.5.0;

import 'zos-lib/contracts/Initializable.sol';
import 'openzeppelin-eth/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-eth/contracts/token/ERC721/ERC721Mintable.sol';

contract MyNFT is Initializable, ERC721Full, ERC721Mintable {
  function initialize() public initializer {
    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize("MyNFT", "MNFT");
    ERC721Mintable.initialize(msg.sender);
  }
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle] or [Embark].

On our site you will find a few [guides] to learn about the different parts of OpenZeppelin, as well as [documentation for the API][API docs]. Keep in mind that the API docs are work in progress, and don’t hesitate to ask questions in [our forum][forum].

## Security

OpenZeppelin the project is maintained by [Zeppelin] the company, and developed following our high standards for code quality and security. OpenZeppelin is meant to provide tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problems you might experience.

The core development principles and strategies that OpenZeppelin is based on include: security in depth, simple and modular code, clarity-driven naming conventions, comprehensive unit testing, pre-and-post-condition sanity checks, code consistency, and regular audits.

The latest audit was done on October 2018 on version 2.0.0.

Please report any security issues you find to security@openzeppelin.org.

## Contribute

OpenZeppelin exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## License

OpenZeppelin is released under the [MIT License](LICENSE).

[API docs]: https://docs.openzeppelin.org/v2.2.0/api/token/erc721
[guides]: https://docs.openzeppelin.org/v2.2.0/get-started
[forum]: https://forum.zeppelin.solutions
[Zeppelin]: https://zeppelin.solutions
[contribution guide]: CONTRIBUTING.md
[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
