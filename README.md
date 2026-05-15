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

New files added to the OpenZeppelin repository structure:

- `contracts/token/ERC20/extensions/ERC20SafeApproval.sol` — main extension contract
- `contracts/mocks/token/ERC20SafeApprovalMock.sol` — mock contract used for testing
- `test/token/ERC20/extensions/ERC20SafeApproval.test.js` — Hardhat test suite
- `scripts/deployERC20SafeApproval.js` — Sepolia deployment script

---

## Getting Started

### Prerequisites

- Node.js
- Git

### Installation

```bash
git clone https://github.com/kennyb66/CS5833-FinalProject
cd CS5833-FinalProject
npm install
```

### Build

```bash
npm run compile
```

### Run Tests

```bash
npm run test test/token/ERC20/extensions/ERC20SafeApproval.test.js
```

### Deploy to Sepolia

Create a `.env` file in the root of the repo:

```
SEPOLIA_RPC_URL=your_rpc_url_here
PRIVATE_KEY=your_private_key_here
```

Then run:

```bash
./node_modules/.bin/hardhat run scripts/deployERC20SafeApproval.js --network sepolia
```

---

## Testnet Deployment

| Contract | Network | Address |
|----------|---------|---------|
| ERC20SafeApprovalMock | Sepolia | `0xdD1bf110349890E6183537eec6200775d425Dd0f` |

Verified on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xdD1bf110349890E6183537eec6200775d425Dd0f)

**Transactions:**

| Transaction | Hash |
|-------------|------|
| Mint | [0x6ff8385d...](https://sepolia.etherscan.io/tx/0x6ff8385d0ab3ea04af89dfaee6333c8ea6e821985d1917ff667ed4df0675e559) |
| Approve | [0x0a48fc2c...](https://sepolia.etherscan.io/tx/0x0a48fc2cf04500729582d4507a322826af6398dd8a1eb430b602c59a885dd864) |
| ApproveWithExpiration | [0xfc6893b8...](https://sepolia.etherscan.io/tx/0xfc6893b80e466afe456fea38eacb2aea2d9d8a8ed00ac2881e5a254776ee9a6f) |

---

## Gas Benchmarks

| Function | Standard ERC-20 | ERC20SafeApproval | Overhead |
|----------|----------------|-------------------|----------|
| `approve()` | 46,000 | 48,296 | +2,296 (+5%) |
| `approveWithExpiration()` | N/A | 73,112 | N/A |
| `transferFrom()` | 34,000 | 59,910 | +25,910 (+76%) |

*Measured using hardhat-gas-reporter. The `transferFrom()` overhead reflects the additional expiry check performed before each transfer.*

---

## Usage Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./extensions/ERC20SafeApproval.sol";

contract MyToken is ERC20SafeApproval {
    constructor() ERC20("MyToken", "MTK") ERC20SafeApproval(1000) {
        // approval cap set to 1000 tokens at deploy time
    }
}
```

---

## Team Contributions

| Member | Contributions |
|--------|--------------|
| Kenny Bartel | Project proposal, repository setup, test suite implementation, deployment script, GitHub contribution artifacts |
| Brianna Patten | Project report, ERC20SafeApproval extension contract, ERC20SafeApprovalToken contract, ERC20SafeApprovalMock contract |

---

## Demo Video

[Demo Link](https://drive.google.com/file/d/1E0e3O1lz2cZ3P9AZo5LPKV2ekhCwC3fD/view?usp=sharing)

---

## References

- [OpenZeppelin ERC20 source](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20)
- [ERC-2612 / ERC20Permit](https://eips.ethereum.org/EIPS/eip-2612)
- [OpenZeppelin contribution guidelines](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/CONTRIBUTING.md)
- [Upstream Issue #6500](https://github.com/OpenZeppelin/openzeppelin-contracts/issues/6500)
