# OpenZeppelin Contracts Tutorial

Welcome to the OpenZeppelin Contracts tutorial! This guide will help you get started with using OpenZeppelin contracts such as `ERC20`, `ERC721`, and more. OpenZeppelin provides secure and community-vetted smart contract libraries that you can use to build your own blockchain applications.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Setting Up Your Development Environment](#setting-up-your-development-environment)
- [Using OpenZeppelin Contracts](#using-openzeppelin-contracts)
  - [Creating an ERC20 Token](#creating-an-erc20-token)
  - [Creating an ERC721 Token](#creating-an-erc721-token)
  - [Additional Resources](#additional-resources)

## Prerequisites

Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v12 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Truffle](https://www.trufflesuite.com/truffle) or [Hardhat](https://hardhat.org/)

## Setting Up Your Development Environment

1. **Initialize a New Project:**
   ```bash
   mkdir my-openzeppelin-project
   cd my-openzeppelin-project
   npm init -y

2. **Install OpenZeppelin Contracts:**
   ```bash
   npm install @openzeppelin/contracts

3. **Install Truffle or Hardhat:**
   ```bash
   npm install truffle
   truffle init

4. **Using Hardhat:**
   ```bash
   npm install --save-dev hardhat
   npx hardhat

# Using OpenZeppelin Contracts
##Create an ERC20 Token

1. Create the Token Contract: Create a new file MyToken.sol in the contracts directory.

   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

   contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
     }
   }

2. Compile the Contract:

a : #### Using Truffle

  ```bash  
    truffle compile
 
b : #### Using Hardhat

  ```bash
     npx hardhat compile

3. Deploy the Contract:

   Using Truffle: Create a new deployment script in the migrations directory.

   ```javascript
   const MyToken = artifacts.require("MyToken");

   module.exports = function (deployer) {
     deployer.deploy(MyToken, 1000000);
   };

  Deploy the contract:
  ```bash
  truffle migrate

  Using Hardhat: Create a new deployment script in the scripts directory

  ```javascript
  async function main() {
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(1000000);
  await token.deployed();
   console.log("Token deployed to:", token.address);
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

 Deploy the contract:  

 ```bash
 npx hardhat run scripts/deploy.js







  





