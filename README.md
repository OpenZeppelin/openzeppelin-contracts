# <img src="logo.svg" alt="OpenZeppelin" height="40px">

*The most widely adopted library for secure smart contract development in Solidity.*

[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/contracts.svg)](https://www.npmjs.org/package/@openzeppelin/contracts)
[![NPM Downloads](https://img.shields.io/npm/dm/@openzeppelin/contracts.svg?color=purple)](https://www.npmjs.org/package/@openzeppelin/contracts)
[![Coverage Status](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts)
[![GitPOAPs](https://public-api.gitpoap.io/v1/repo/OpenZeppelin/openzeppelin-contracts/badge)](https://www.gitpoap.io/gh/OpenZeppelin/openzeppelin-contracts)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-yellow)](https://docs.openzeppelin.com/contracts)
[![Forum](https://img.shields.io/badge/forum-%F0%9F%92%AC-yellow)](https://docs.openzeppelin.com/contracts)

## Use Cases
* Build tokens and NFTs using audited and battle-tested implementations of [ERC20](https://docs.openzeppelin.com/contracts/erc20), [ERC721](https://docs.openzeppelin.com/contracts/erc721), and [ERC1155](https://docs.openzeppelin.com/contracts/erc1155).
* Manage permissions using state-of-the-art [AccessManager](https://docs.openzeppelin.com/contracts/5.x/api/access#AccessManager).
* Set up and manage on-chain [Governance]https://docs.openzeppelin.com/contracts/governance).
* Employ reusable [Solidity components](https://docs.openzeppelin.com/contracts/utilities) to build custom contracts and complex decentralized systems.

:mage: **Not sure how to get started?** Check out [Contracts Wizard](https://wizard.openzeppelin.com/) — an interactive smart contract generator.


## Installation
```
# Hardhat
npm install @openzeppelin/contracts 

# Foundry
forge install OpenZeppelin/openzeppelin-contracts
```

### Foundry
If using Foundry, add `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/` in `remappings.txt` after running `forge install`

> [!WARNING]
> `forge install` installs the latest tagged version, but subsequent `forge update` commands will use the `master` branch.
>
> Be sure to use tagged versions to ensure your code has gone through our secure release process.

### Semantic Versioning
OpenZeppelin Contracts uses semantic versioning to communicate backwards compatibility of its API and storage layout. For upgradeable contracts, the storage layout of different major versions should be assumed incompatible, for example, it is unsafe to upgrade from 4.9.3 to 5.0.0. Learn more at [Backwards Compatibility](https://docs.openzeppelin.com/contracts/backwards-compatibility).

## Usage
Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyCollectible is ERC721 {
    constructor() ERC721("MyCollectible", "MCO") {
    }
}
```

_If you're new to smart contract development, head to [Developing Smart Contracts](https://docs.openzeppelin.com/learn/developing-smart-contracts) to learn about creating a new project and compiling your contracts._


### Secure Code
To keep your system secure, you should **always** use the installed code as-is, and neither copy-paste it from online sources nor modify it yourself. The library is designed so that only the contracts and functions you use in your code are deployed, ensuring greater gas efficiency.

As best practice, we also recommend using OpenZeppelin Defender's [Code App](https://docs.openzeppelin.com/defender/v2/module/code), which uses state-of-the-art static analysis and machine learning to conduct security analysis, ensure dependencies stay up-to-date, and help you remain aware of potential vulnerabilities and/or potential efficiency improvements in your code.

### Audit and Deploy
OpenZeppelin Defender is equipped to help you audit your code smoothly and deploy to test and production environments across all target chains. 

We used [Audit](https://docs.openzeppelin.com/defender/v2/module/audit) to streamline the fix-review process and ensure all changes were tracked and resolved effectively, and we recommend [Deploy](https://docs.openzeppelin.com/defender/v2/module/deploy) as well to seamlessly handle gas payments, multisig approvals, and block explorer verification. While these constitute security best practices, Contracts is compatible with all deployment methods.

## Security
This project is maintained by [OpenZeppelin](https://openzeppelin.com) with the goal of providing a secure and reliable library of smart contract components for the Solidity ecosystem. We address security through risk management in various areas such as engineering and open source best practices, scoping and API design, multi-layered review processes, and incident response preparedness.

The engineering guidelines we follow to promote project quality can be found in [`GUIDELINES.md`](./GUIDELINES.md).

The [OpenZeppelin Contracts Security Center](https://contracts.openzeppelin.com/security) contains more details about the secure development process, including past audits, our bug bounty program, and advanced testing methods such as fuzzing and formal verification.

Smart contracts are a nascent technology and carry a high level of technical risk and uncertainty. Although OpenZeppelin is well known for its security audits, using OpenZeppelin Contracts is not a substitute for a security audit.

OpenZeppelin Contracts is made available under the MIT License, which disclaims all warranties in relation to the project and which limits the liability of those that contribute and maintain the project, including OpenZeppelin. As set out further in the Terms, you acknowledge that you are solely responsible for any use of OpenZeppelin Contracts and you assume all risks associated with any such use.

### Monitoring and Operations
Thousands of projects have deployed OpenZeppelin Contracts, and [monitoring templates](https://docs.openzeppelin.com/defender/v2/module/monitor) are available via Defender for common use cases. The same is true for automating [Actions](https://docs.openzeppelin.com/defender/v2/module/actions) post-deploy.

## Learn More

The guides in the [documentation site](https://docs.openzeppelin.com/contracts) will teach about different concepts, and how to use the related contracts that OpenZeppelin Contracts provides.

The [full API](https://docs.openzeppelin.com/contracts/api/token/ERC20) is also thoroughly documented, and serves as a great reference when developing your smart contract application. You are also welcome to ask for assistance and follow Contracts development in the [community forum](https://forum.openzeppelin.com).

Finally, you may want to take a look at the [guides on our blog](https://blog.openzeppelin.com/), which cover several common use cases and best practices.

## Contribute

OpenZeppelin Contracts exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide](CONTRIBUTING.md)!

## License

OpenZeppelin Contracts is released under the [MIT License](LICENSE).

## Legal

Your use of this Project is governed by the terms found at www.openzeppelin.com/tos (the "Terms").
