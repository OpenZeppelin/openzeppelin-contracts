# <img src="logo.png" alt="OpenZeppelin" width="400px">

# OpenZeppelin EVM Package

[![NPM Package](https://img.shields.io/npm/v/openzeppelin-eth.svg?style=flat-square)](https://www.npmjs.org/package/openzeppelin-eth)
[![Build Status](https://img.shields.io/travis/OpenZeppelin/openzeppelin-eth.svg?branch=master&style=flat-square)](https://travis-ci.org/OpenZeppelin/openzeppelin-eth)

**OpenZeppelin is a library for secure smart contract development.** It provides implementations of standards like ERC20 and ERC721 which you can deploy as-is or extend to suit your needs, as well as Solidity components to build custom contracts and more complex decentralized systems.

This fork of OpenZeppelin is set up as a **reusable EVM Package**. It is deployed to the kovan, rinkeby, and ropsten test networks, as well as to the main Ethereum network. You can reuse any of the pre-deployed on-chain contracts by simply linking to them using [ZeppelinOS](https://github.com/zeppelinos/zos), or reuse their Solidity source code as with the vanilla version of OpenZeppelin.

## Install

```
npm install openzeppelin-eth
```

## Usage

To write your custom contracts, import ours and extend them through inheritance.

```solidity
pragma solidity ^0.5.0;

import 'zos-lib/contracts/Initializable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol';

contract MyNFT is Initializable, ERC721Full, ERC721Mintable {
  function initialize() public initializer {
    ERC721Full.initialize("MyNFT", "MNFT");
  }
}
```

## Pre-deployed contracts

- StandaloneERC20
- StandaloneERC721
- TokenVesting
- PaymentSplitter

## License

OpenZeppelin is released under the [MIT License](LICENSE).

[Slack]: https://slack.openzeppelin.org
[Zeppelin]: https://zeppelin.solutions
