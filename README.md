# <img src="logo.png" alt="OpenZeppelin" height="40px">

[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/contracts.svg)](https://www.npmjs.org/package/@openzeppelin/contracts)
[![Build Status](https://circleci.com/gh/OpenZeppelin/openzeppelin-contracts.svg?style=shield)](https://circleci.com/gh/OpenZeppelin/openzeppelin-contracts)
[![Coverage Status](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/openzeppelin-contracts)

**OpenZeppelin Contracts is a library for secure smart contract development.** It provides implementations of standards like ERC20 and ERC721 which you can deploy as-is or extend to suit your needs, as well as Solidity components to build custom contracts and more complex decentralized systems.

## Install

```
npm install @openzeppelin/contracts
```

OpenZeppelin Contracts features a stable API, which means your contracts won't break unexpectedly when upgrading to a newer minor version. You can read ṫhe details in our [API Stability] document.

## Usage

To write your custom contracts, import ours and extend them through inheritance.

```solidity
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Mintable.sol";

contract MyNFT is ERC721Full, ERC721Mintable {
  constructor() ERC721Full("MyNFT", "MNFT") public {
  }
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle], [Embark] or [Buidler].

On our site you will find a few [guides] to learn about the different parts of OpenZeppelin, as well as [documentation for the API][API docs]. Keep in mind that the API docs are work in progress, and don’t hesitate to ask questions in [our forum][forum].

## Security

This project is maintained by [OpenZeppelin], and developed following our high standards for code quality and security. OpenZeppelin is meant to provide tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problems you might experience.

The core development principles and strategies that OpenZeppelin is based on include: security in depth, simple and modular code, clarity-driven naming conventions, comprehensive unit testing, pre-and-post-condition sanity checks, code consistency, and regular audits.

The latest audit was done on October 2018 on version 2.0.0.

Please report any security issues you find to security@openzeppelin.org.

## Contribute

OpenZeppelin exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## License

OpenZeppelin is released under the [MIT License](LICENSE).


[API docs]: https://docs.openzeppelin.com/contracts/api/token/erc20
[guides]: https://docs.openzeppelin.com/contracts
[API Stability]: https://docs.openzeppelin.com/contracts/api-stability
[forum]: https://forum.openzeppelin.com
[OpenZeppelin]: https://openzeppelin.com
[contribution guide]: CONTRIBUTING.md
[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
[Buidler]: https://buidler.dev/getting-started/#overview
