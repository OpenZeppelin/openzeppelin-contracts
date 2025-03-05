# Token Testing Utilities

This directory contains mock token implementations that can be used for testing purposes.

## Available Mocks

### MockERC20

A simple ERC20 token implementation with mint and burn functions.

```solidity
// Create a new token
MockERC20 token = new MockERC20("Test Token", "TEST");

// Mint tokens
token.mint(address, amount);

// Burn tokens
token.burn(address, amount);
```

### MockERC721

A simple ERC721 token implementation with mint, safeMint, and burn functions.

```solidity
// Create a new token
MockERC721 token = new MockERC721("Test NFT", "TNFT");

// Mint a token
token.mint(to, tokenId);

// Safe mint a token
token.safeMint(to, tokenId);
token.safeMint(to, tokenId, data);

// Burn a token
token.burn(tokenId);
```

## Use Cases

These mock tokens are useful for:

1. Testing contracts that interact with ERC20 or ERC721 tokens
2. Simulating token transfers in test environments
3. Testing token-based functionality without deploying complex token implementations
4. Rapid prototyping of token-based systems 