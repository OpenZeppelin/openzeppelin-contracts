# zeppelin-solidity
Secure Smart Contract library for the Solidity language

Provides contracts to help with easy implementation of common security patterns. See [Onward with Ethereum Smart Contract Security](https://medium.com/bitcorps-blog/onward-with-ethereum-smart-contract-security-97a827e47702#.y3kvdetbz).

## Getting started

Zeppelin integrates with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. Please [install Truffle](https://github.com/ConsenSys/truffle#install) and initialize your project with `truffle init`.
```
sudo npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

To install the Zeppelin library, run:
```
npm i zeppelin-solidity
```

After that, you'll get all the library's contracts in the `contracts/zeppelin` folder. You can use the contracts in the library like so:

```
import "./zeppelin/Rejector.sol";

contract MetaCoin is Rejector { 
  ...
}
```

## Contracts
TODO
