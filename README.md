# <img src="logo.svg" alt="OpenZeppelin" height="40px">

[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/contracts.svg)](https://www.npmjs.org/package/@openzeppelin/contracts)
[![Coverage Status](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts)
[![GitPOAPs](https://public-api.gitpoap.io/v1/repo/OpenZeppelin/openzeppelin-contracts/badge)](https://www.gitpoap.io/gh/OpenZeppelin/openzeppelin-contracts)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-yellow)](https://docs.openzeppelin.com/contracts)
[![Forum](https://img.shields.io/badge/forum-%F0%9F%92%AC-yellow)](https://docs.openzeppelin.com/contracts)

**A library for secure smart contract development.** Build on a solid foundation of community-vetted code.

 * Implementations of standards like [ERC20](https://docs.openzeppelin.com/contracts/erc20) and [ERC721](https://docs.openzeppelin.com/contracts/erc721).
 * Flexible [role-based permissioning](https://docs.openzeppelin.com/contracts/access-control) scheme.
 * Reusable [Solidity components](https://docs.openzeppelin.com/contracts/utilities) to build custom contracts and complex decentralized systems.

:mage: **Not sure how to get started?** Check out [Contracts Wizard](https://wizard.openzeppelin.com/) — an interactive smart contract generator.

:building_construction: **Want to scale your decentralized application?** Check out [OpenZeppelin Defender](https://openzeppelin.com/defender) — a secure platform for automating and monitoring your operations.

> [!IMPORTANT]
> OpenZeppelin Contracts uses semantic versioning to communicate backwards compatibility of its API and storage layout. For upgradeable contracts, the storage layout of different major versions should be assumed incompatible, for example, it is unsafe to upgrade from 4.9.3 to 5.0.0. Learn more at [Backwards Compatibility](https://docs.openzeppelin.com/contracts/backwards-compatibility).

## Overview

### Installation

#### Hardhat, Truffle (npm)

```
$ npm install @openzeppelin/contracts
```

#### Foundry (git)

> [!WARNING]
> When installing via git, it is a common error to use the `master` branch. This is a development branch that should be avoided in favor of tagged releases. The release process involves security measures that the `master` branch does not guarantee.

> [!WARNING]
> Foundry installs the latest version initially, but subsequent `forge update` commands will use the `master` branch.

```
$ forge install OpenZeppelin/openzeppelin-contracts
```

Add `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/` in `remappings.txt.` 

### Usage

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyCollectible is ERC721 {
    constructor() ERC721("MyCollectible", "MCO") {
    }
}
```

_If you're new to smart contract development, head to [Developing Smart Contracts](https://docs.openzeppelin.com/learn/developing-smart-contracts) to learn about creating a new project and compiling your contracts._

To keep your system secure, you should **always** use the installed code as-is, and neither copy-paste it from online sources nor modify it yourself. The library is designed so that only the contracts and functions you use are deployed, so you don't need to worry about it needlessly increasing gas costs.

## Learn More

The guides in the [documentation site](https://docs.openzeppelin.com/contracts) will teach about different concepts, and how to use the related contracts that OpenZeppelin Contracts provides:

* [Access Control](https://docs.openzeppelin.com/contracts/access-control): decide who can perform each of the actions on your system.
* [Tokens](https://docs.openzeppelin.com/contracts/tokens): create tradeable assets or collectives, and distribute them via [Crowdsales](https://docs.openzeppelin.com/contracts/crowdsales).
* [Utilities](https://docs.openzeppelin.com/contracts/utilities): generic useful tools including non-overflowing math, signature verification, and trustless paying systems.

The [full API](https://docs.openzeppelin.com/contracts/api/token/ERC20) is also thoroughly documented, and serves as a great reference when developing your smart contract application. You can also ask for help or follow Contracts's development in the [community forum](https://forum.openzeppelin.com).

Finally, you may want to take a look at the [guides on our blog](https://blog.openzeppelin.com/), which cover several common use cases and good practices. The following articles provide great background reading, though please note that some of the referenced tools have changed, as the tooling in the ecosystem continues to rapidly evolve.

* [The Hitchhiker’s Guide to Smart Contracts in Ethereum](https://blog.openzeppelin.com/the-hitchhikers-guide-to-smart-contracts-in-ethereum-848f08001f05) will help you get an overview of the various tools available for smart contract development, and help you set up your environment.
* [A Gentle Introduction to Ethereum Programming, Part 1](https://blog.openzeppelin.com/a-gentle-introduction-to-ethereum-programming-part-1-783cc7796094) provides very useful information on an introductory level, including many basic concepts from the Ethereum platform.
* For a more in-depth dive, you may read the guide [Designing the Architecture for Your Ethereum Application](https://blog.openzeppelin.com/designing-the-architecture-for-your-ethereum-application-9cec086f8317), which discusses how to better structure your application and its relationship to the real world.

## Security

This project is maintained by [OpenZeppelin](https://openzeppelin.com) with the goal of providing a secure and reliable library of smart contract components for the ecosystem. We address security through risk management in various areas such as engineering and open source best practices, scoping and API design, multi-layered review processes, and incident response preparedness.

The [OpenZeppelin Contracts Security Center](https://contracts.openzeppelin.com/security) contains more details about the secure development process.

The security policy is detailed in [`SECURITY.md`](./SECURITY.md) as well, and specifies how you can report security vulnerabilities, which versions will receive security patches, and how to stay informed about them. We run a [bug bounty program on Immunefi](https://immunefi.com/bounty/openzeppelin) to reward the responsible disclosure of vulnerabilities.

The engineering guidelines we follow to promote project quality can be found in [`GUIDELINES.md`](./GUIDELINES.md).

Past audits can be found in [`audits/`](./audits).

Smart contracts are a nascent technology and carry a high level of technical risk and uncertainty. Although OpenZeppelin is well known for its security audits, using OpenZeppelin Contracts is not a substitute for a security audit.

OpenZeppelin Contracts is made available under the MIT License, which disclaims all warranties in relation to the project and which limits the liability of those that contribute and maintain the project, including OpenZeppelin. As set out further in the Terms, you acknowledge that you are solely responsible for any use of OpenZeppelin Contracts and you assume all risks associated with any such use.

## Contribute

OpenZeppelin Contracts exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

OpenZeppelin Contracts is released under the [MIT License](LICENSE).

## Legal

Your use of this Project is governed by the terms found at www.openzeppelin.com/tos (the "Terms").
