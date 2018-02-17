# Zeppelin Solidity
[![NPM Package](https://img.shields.io/npm/v/zeppelin-solidity.svg?style=flat-square)](https://www.npmjs.org/package/zeppelin-solidity)
[![Build Status](https://img.shields.io/travis/OpenZeppelin/zeppelin-solidity.svg?branch=master&style=flat-square)](https://travis-ci.org/OpenZeppelin/zeppelin-solidity)
[![Coverage Status](https://img.shields.io/coveralls/github/OpenZeppelin/zeppelin-solidity/master.svg?style=flat-square)](https://coveralls.io/github/OpenZeppelin/zeppelin-solidity?branch=master)

OpenZeppelin is a library for writing secure [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) on Ethereum.

With OpenZeppelin, you can build distributed applications, protocols and organizations:
- using common contract security patterns (See [Onward with Ethereum Smart Contract Security](https://medium.com/bitcorps-blog/onward-with-ethereum-smart-contract-security-97a827e47702#.y3kvdetbz))
- in the [Solidity language](https://solidity.readthedocs.io/en/develop/).

> NOTE: New to smart contract development? Check our [introductory guide](https://medium.com/zeppelin-blog/the-hitchhikers-guide-to-smart-contracts-in-ethereum-848f08001f05#.cox40d2ut).

## Getting Started

OpenZeppelin integrates with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. Please install Truffle and initialize your project with `truffle init`.

```sh
npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

To install the OpenZeppelin library, run the following in your Solidity project root directory:
```sh
npm init -y
npm install -E zeppelin-solidity
```

**Note that OpenZeppelin does not currently follow semantic versioning.** You may encounter breaking changes upon a minor version bump. We recommend pinning the version of OpenZeppelin you use, as done by the `-E` (`--save-exact`) option.

After that, you'll get all the library's contracts in the `node_modules/zeppelin-solidity/contracts` folder. You can use the contracts in the library like so:

```js
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract MyContract is Ownable {
  ...
}
```


## Security
OpenZeppelin is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problem you might experience.

If you find a security issue, please email [security@openzeppelin.org](mailto:security@openzeppelin.org).

## Developer Resources

Building a distributed application, protocol or organization with OpenZeppelin?

- Read documentation: https://openzeppelin.org/api/docs/open-zeppelin.html

- Ask for help and follow progress at: https://slack.openzeppelin.org/

Interested in contributing to OpenZeppelin?

- Framework proposal and roadmap: https://medium.com/zeppelin-blog/zeppelin-framework-proposal-and-development-roadmap-fdfa9a3a32ab#.iain47pak
- Issue tracker: https://github.com/OpenZeppelin/zeppelin-solidity/issues
- Contribution guidelines: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/CONTRIBUTING.md
- Wiki: https://github.com/OpenZeppelin/zeppelin-solidity/wiki

## Collaborating organizations and audits by OpenZeppelin
- [Golem](https://golem.network/)
- [Mediachain](http://www.mediachain.io/)
- [Truffle](http://truffleframework.com/)
- [Firstblood](https://firstblood.io/)
- [Rootstock](https://www.rsk.co/)
- [Consensys](https://consensys.net/)
- [DigixGlobal](https://www.dgx.io/)
- [Coinfund](https://coinfund.io/)
- [DemocracyEarth](https://democracy.earth/)
- [Signatura](https://signatura.co/)
- [Ether.camp](http://www.ether.camp/)
- [Aragon](https://aragon.one/)
- [Wings](https://wings.ai/)

among others...


## License
Code released under the [MIT License](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/LICENSE).
