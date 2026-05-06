# ERC20SafeApproval — OpenZeppelin Extension

> A contribution-quality extension of OpenZeppelin's ERC20 contract that adds
> configurable approval caps and per-approval expiration timestamps.

**Team:** Kenny Bartel & Brianna Patten
**Course:** CS5833
**Upstream Repo:** [OpenZeppelin/openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
**Related Issue:** [openzeppelin-contracts#6500](https://github.com/OpenZeppelin/openzeppelin-contracts/issues/6500)

---

## Overview

The standard ERC-20 approval mechanism allows unlimited, non-expiring approvals.
This has been a known vector for token drains in DeFi, where users who previously
signed unlimited approvals to contracts that later turned malicious had their tokens
drained. While OpenZeppelin's `ERC20Permit` (ERC-2612) addresses expiry via
off-chain signatures, it requires EIP-712 infrastructure not available in simpler
applications and does not address approval caps.

`ERC20SafeApproval` is an abstract Solidity extension that enforces both on-chain
through simple inheritance, requiring no off-chain signing infrastructure.

---

## Features

- **Approval Cap** — a configurable maximum approval ceiling; no spender can ever
  be approved above this limit regardless of what the user signs
- **Approval Expiry** — per-approval expiration timestamps; expired approvals
  automatically revert in `transferFrom()`

---

## Project Structure
contracts/
└── token/
└── ERC20/
└── extensions/
└── ERC20SafeApproval.sol   # main extension
test/
└── token/
└── ERC20/
└── ERC20SafeApproval.t.sol     # Foundry test suite
script/
└── DeployERC20SafeApproval.s.sol       # Sepolia deployment script

---

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Installation

```bash
git clone https://github.com/kennyb66/CS5833-FinalProject
cd contracts
forge install
```

### Build

```bash
forge build
```

### Run Tests

```bash
forge test --match-path test/token/ERC20/ERC20SafeApproval.t.sol -v
```

### Run Gas Benchmarks

```bash
forge test --match-path test/token/ERC20/ERC20SafeApproval.t.sol --gas-report
```

### Deploy to Sepolia

```bash
forge script script/DeployERC20SafeApproval.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## Testnet Deployment

| Contract | Network | Address |
|----------|---------|---------|
| ERC20SafeApproval | Sepolia | `0x...` |

Verified on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x...)

---

## Gas Benchmarks

| Function | Base ERC20 | ERC20SafeApproval | Delta |
|----------|-----------|-------------------|-------|
| `approve()` | - | - | - |
| `transferFrom()` | - | - | - |

*To be filled in during Week 3*

---

## Usage Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./extensions/ERC20SafeApproval.sol";

contract MyToken is ERC20SafeApproval {
    constructor() ERC20("MyToken", "MTK") {
        // set approval cap to 1000 tokens
        // set default expiry to 30 days
    }
}
```

---

## Team Contributions

| Member | Contributions |
|--------|--------------|
| Kenny Bartel | |
| Brianna Patten | |

*To be filled in as work progresses*

---

## Demo Video

*Link to be added in Week 3*

---

## References

- [OpenZeppelin ERC20 source](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20)
- [ERC-2612 / ERC20Permit](https://eips.ethereum.org/EIPS/eip-2612)
- [OpenZeppelin contribution guidelines](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/CONTRIBUTING.md)
