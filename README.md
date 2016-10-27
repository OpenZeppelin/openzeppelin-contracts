# Zeppelin Solidity
Zeppelin is a library for writing secure Smart Contracts on Ethereum.

With Zeppelin, you can build distributed applications, protocols and organizations:
- using common contract security patterns (See [Onward with Ethereum Smart Contract Security](https://medium.com/bitcorps-blog/onward-with-ethereum-smart-contract-security-97a827e47702#.y3kvdetbz))
- in the Solidity language.

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

> NOTE: The current distribution channel is npm, which is not ideal. [We're looking into providing a better tool for code distribution](https://github.com/OpenZeppelin/zeppelin-solidity/issues/13), and ideas are welcome.

## Add your own bounty contract

So far you inherit Zeppelin contracts into your own contract through inheritance.
A bounty contract, however, is a special contract that is deployed on its own.
Each researcher creates a separate copy of your contract, and can claims bounty by breaking invariants logic on the copy of your contract without hacking your original contract.

To use the bounty contract, please follow the below instruction.

### Implement invariant logic into your smart contract

At contracts/YourContract.sol

```
contract YourContract {
  function checkInvariant() returns(bool){
    // Implement your logic to make sure that none of the state is broken.
  }
}

contract YourContractFactory {
  function deployContract() returns (address) {
    // This contract allows researchers to create a copy of your contract
    return new YourContract();
  }
}
```

### Add the bounty contracts as well as your contracts into migrations

At `migrations/2_deploy_contracts.js`

```
module.exports = function(deployer) {
  deployer.deploy(YourContract);
  deployer.deploy(YourContractFactory);
  deployer.deploy(Bounty);
};
```

### Add a reward to the bounty contract

After deploying the contract, send rewards money into the bounty contract.

From `truffle console`

```
address = 'your account address'
reward = 'reward to pay to a researcher'

web3.eth.sendTransaction({
  from:address,
  to:bounty.address,
  value: web3.toWei(reward, "ether")
}

```

### Researchers hack the contract and claim their reward.

For each researcher who wants to hack the contract and claims the reward, refer to our [test](./test/Bounty.js) for the detail.

### Ends the contract

If you manage to protect your contract from security researchers and wants to end the bounty, kill the contract so that all the rewards go back to the owner of the bounty contract.

```
bounty.kill()
```

#### Truffle Beta Support
We also support Truffle Beta npm integration. If you're using Truffle Beta, the contracts in `node_modules` will be enough, so feel free to delete the copies at your `contracts` folder. If you're using Truffle Beta, you can use Zeppelin contracts like so:

```js
import "zeppelin-solidity/contracts/Rejector.sol";

contract MetaCoin is Rejector {
  ...
}
```

For more info see [the Truffle Beta package management tutorial](http://truffleframework.com/tutorials/package-management).

## Security
Zeppelin is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problem you might experience.

If you find a security issue, please email [security@openzeppelin.org](mailto:security@openzeppelin.org).

## Developer Resources

Building a distributed application, protocol or organization with Zeppelin?

- Ask for help and follow progress at: https://zeppelin-slackin.herokuapp.com/

Interested in contributing to Zeppelin?

- Framework proposal and roadmap: https://medium.com/zeppelin-blog/zeppelin-framework-proposal-and-development-roadmap-fdfa9a3a32ab#.iain47pak
- Issue tracker: https://github.com/OpenZeppelin/zeppelin-solidity/issues
- Contribution guidelines: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/CONTRIBUTING.md

## Projects using Zeppelin
- [Blockparty](https://github.com/makoto/blockparty)

## Contracts
TODO

## License
Code released under the [MIT License](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/LICENSE).
