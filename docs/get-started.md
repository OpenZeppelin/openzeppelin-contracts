---
id: get-started
title: Getting Started
---

**OpenZeppelin is a library for secure smart contract development.** It provides implementations of standards like ERC20 and ERC721 which you can deploy as-is or extend to suit your needs, as well as Solidity components to build custom contracts and more complex decentralized systems.

## Install

OpenZeppelin should be installed directly into your existing node.js project with `npm install openzeppelin-solidity`. We will use [Truffle](https://truffleframework.com/truffle), an Ethereum development environment, to get started.

Please install Truffle and initialize your project:

```sh
$ mkdir myproject
$ cd myproject
$ npm init -y
$ npm install truffle
$ npx truffle init
```

To install the OpenZeppelin library, run the following in your Solidity project root directory:

```sh
$ npm install openzeppelin-solidity
```

_OpenZeppelin features a stable API, which means your contracts won't break unexpectedly when upgrading to a newer minor version. You can read ṫhe details in our [API Stability](api-stability) document._

## Usage

Once installed, you can start using the contracts in the library by importing them:

```solidity
pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract MyContract is Ownable {
  ...
}
```

Truffle and other Ethereum development toolkits will automatically detect the installed library, and compile the imported contracts.

>You should always use the installed code as-is, and neither copy-paste it from online sources, nor modify it yourself.

## Next Steps

Check out the the guides in the sidebar to learn about different concepts, and how to use the contracts that OpenZeppelin provides.

- [Learn about Access Control](access-control)
- [Learn about Crowdsales](crowdsales)
- [Learn about Tokens](tokens)
- [Learn about our Utilities](utilities)

OpenZeppelin's [full API](api/token/ERC20) is also thoroughly documented, and serves as a great reference when developing your smart contract application.

Additionally, you can also ask for help or follow OpenZeppelin's development in the [community forum](https://forum.zeppelin.solutions).

Finally, you may want to take a look at the guides on our blog, which cover several common use cases and good practices: https://blog.zeppelin.solutions/guides/home. The following articles provide great background reading, though please note, some of the referenced tools have changed as the tooling in the ecosystem continues to rapidly evolve.

 * [The Hitchhiker’s Guide to Smart Contracts in Ethereum](https://blog.zeppelin.solutions/the-hitchhikers-guide-to-smart-contracts-in-ethereum-848f08001f05) will help you get an overview of the various tools available for smart contract development, and help you set up your environment

 * [A Gentle Introduction to Ethereum Programming, Part 1](https://blog.zeppelin.solutions/a-gentle-introduction-to-ethereum-programming-part-1-783cc7796094) provides very useful information on an introductory level, including many basic concepts from the Ethereum platform

 * For a more in-depth dive, you may read the guide [Designing the architecture for your Ethereum application](https://blog.zeppelin.solutions/designing-the-architecture-for-your-ethereum-application-9cec086f8317), which discusses how to better structure your application and its relationship to the real world
