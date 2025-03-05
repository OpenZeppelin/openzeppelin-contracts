# Testing Utilities

This directory contains contracts that are meant to be used for testing purposes by users of the OpenZeppelin Contracts library.

Unlike the contracts in the `mocks` directory, which are primarily used for internal testing of the library itself, these contracts are designed to be used by developers who are building on top of OpenZeppelin Contracts.

## Available Testing Contracts

### Token

- `MockERC20`: A simple ERC20 token implementation with mint and burn functions
- `MockERC721`: A simple ERC721 token implementation with mint, safeMint, and burn functions

## Usage

These contracts can be imported and used in your tests to simulate token behavior without having to create your own implementations.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/testing/token/MockERC20.sol";
import "@openzeppelin/contracts/testing/token/MockERC721.sol";

contract MyTest {
    MockERC20 public mockERC20;
    MockERC721 public mockERC721;
    
    constructor() {
        mockERC20 = new MockERC20("Test Token", "TEST");
        mockERC721 = new MockERC721("Test NFT", "TNFT");
        
        // Mint some tokens for testing
        mockERC20.mint(address(this), 1000);
        mockERC721.mint(address(this), 1);
    }
    
    // Your test functions...
}
``` 