# Zeppelin Solidity
[![NPM Package](https://img.shields.io/npm/v/zeppelin-solidity.svg?style=flat-square)](https://www.npmjs.org/package/zeppelin-solidity)
[![Build Status](https://img.shields.io/travis/OpenZeppelin/zeppelin-solidity.svg?branch=master&style=flat-square)](https://travis-ci.org/OpenZeppelin/zeppelin-solidity)

Zeppelin is a library for writing secure [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) on Ethereum.

With Zeppelin, you can build distributed applications, protocols and organizations:
- using common contract security patterns (See [Onward with Ethereum Smart Contract Security](https://medium.com/bitcorps-blog/onward-with-ethereum-smart-contract-security-97a827e47702#.y3kvdetbz))
- in the [Solidity language](http://solidity.readthedocs.io/en/develop/).

## Getting Started

Zeppelin integrates with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. Please install Truffle and initialize your project with `truffle init`.
```sh
npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

To install the Zeppelin library, run:
```sh
npm i zeppelin-solidity
```

After that, you'll get all the library's contracts in the `contracts/zeppelin` folder. You can use the contracts in the library like so:

```js
import "./zeppelin/Ownable.sol";

contract MyContract is Ownable {
  ...
}
```

> NOTE: The current distribution channel is npm, which is not ideal. [We're looking into providing a better tool for code distribution](https://github.com/OpenZeppelin/zeppelin-solidity/issues/13), and ideas are welcome.

#### Truffle Beta Support
We also support Truffle Beta npm integration. If you're using Truffle Beta, the contracts in `node_modules` will be enough, so feel free to delete the copies at your `contracts` folder. If you're using Truffle Beta, you can use Zeppelin contracts like so:

```js
import "zeppelin-solidity/contracts/Ownable.sol";

contract MyContract is Ownable {
  ...
}
```

For more info see [the Truffle Beta package management tutorial](http://truffleframework.com/tutorials/package-management).


## Security
Zeppelin is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problem you might experience.

If you find a security issue, please email [security@openzeppelin.org](mailto:security@openzeppelin.org).

## Developer Resources

Building a distributed application, protocol or organization with Zeppelin?

- Read documentation: http://zeppelin-solidity.readthedocs.io/en/latest/

- Ask for help and follow progress at: https://zeppelin-slackin.herokuapp.com/

Interested in contributing to Zeppelin?

- Framework proposal and roadmap: https://medium.com/zeppelin-blog/zeppelin-framework-proposal-and-development-roadmap-fdfa9a3a32ab#.iain47pak
- Issue tracker: https://github.com/OpenZeppelin/zeppelin-solidity/issues
- Contribution guidelines: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/CONTRIBUTING.md

## Collaborating organizations and audits by Zeppelin
- [Golem](https://golem.network/)
- [Mediachain](https://golem.network/)
- [Truffle](http://truffleframework.com/)
- [Firstblood](http://firstblood.io/)
- [Rootstock](http://www.rsk.co/)
- [Consensys](https://consensys.net/)
- [DigixGlobal](https://www.dgx.io/)
- [Coinfund](https://coinfund.io/)
- [DemocracyEarth](http://democracy.earth/)
- [Signatura](https://signatura.co/)
- [Ether.camp](http://www.ether.camp/)

among others...


## License
Code released under the [MIT License](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/LICENSE).
