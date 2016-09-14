# Zeppelin Solidity
Zeppelin is a secure Smart Contract library for the Solidity language.

Provides contracts to help with easy implementation of common security patterns. See [Onward with Ethereum Smart Contract Security](https://medium.com/bitcorps-blog/onward-with-ethereum-smart-contract-security-97a827e47702#.y3kvdetbz).

## Getting Started

Zeppelin integrates with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. Please [install Truffle](https://github.com/ConsenSys/truffle#install) and initialize your project with `truffle init`.
```sh
sudo npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

To install the Zeppelin library, run:
```sh
npm i zeppelin-solidity
```

After that, you'll get all the library's contracts in the `contracts/zeppelin` folder. You can use the contracts in the library like so:

```js
import "./zeppelin/Rejector.sol";

contract MetaCoin is Rejector { 
  ...
}
```

## Security
Zeppelin is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions.

If you find a security issue, please email [security@openzeppelin.org](mailto:security@openzeppelin.org).

## Developer Resources

Building a distributed application, protocol or organization with Zeppelin?

- Ask for help and follow progress at: https://zeppelin-slackin.herokuapp.com/

Interested in contributing to Zeppelin?

- Framework proposal and roadmap: 
- Issue tracker: https://github.com/OpenZeppelin/zep-solidity/issues
- Contribution guidelines: https://github.com/OpenZeppelin/zep-solidity/blob/master/CONTRIBUTING.md

## Contracts
TODO

## License
Code released under the [MIT License](https://github.com/OpenZeppelin/zep-solidity/blob/master/LICENSE).
