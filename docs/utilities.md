---
id: utilities
title: Utilities
---

OpenZeppelin provides a ton of useful utilities that you can use in your project. Here are some of the more popular ones:

## Cryptography

- [`ECDSA`](api/cryptography#ecdsa) — provides functions for recovering and managing Ethereum account ECDSA signatures:
  - to use it, declare: `using ECDSA for bytes32;`
  - signatures are tightly packed, 65 byte `bytes` that look like `{v (1)} {r (32)} {s (32)}`
    - this is the default from `web3.eth.sign` so you probably don't need to worry about this format
  - recover the signer using [`myDataHash.recover(signature)`](api/cryptography#ECDSA.recover(bytes32,bytes))
  - if you are using `eth_personalSign`, the signer will hash your data and then add the prefix `\x19Ethereum Signed Message:\n`, so if you're attempting to recover the signer of an Ethereum signed message hash, you'll want to use [`toEthSignedMessageHash`](api/cryptography#ECDSA.toEthSignedMessageHash(bytes32))


Use these functions in combination to verify that a user has signed some information on-chain:

```solidity
keccack256(
    abi.encodePacked(
        someData,
        moreData
    )
)
.toEthSignedMessageHash()
.recover(signature)
```

- [`MerkleProof`](api/cryptography#merkleproof) — provides [`verify`](api/cryptography#MerkleProof.verify(bytes32[],bytes32,bytes32)) for verifying merkle proofs.


## Introspection

In Solidity, it's frequently helpful to know whether or not a contract supports an interface you'd like to use. ERC165 is a standard that helps do runtime interface detection. OpenZeppelin provides some helpers, both for implementing ERC165 in your contracts and querying other contracts:

- [`IERC165`](api/introspection#ierc165) — this is the ERC165 interface that defines [`supportsInterface`](api/introspection#IERC165.supportsInterface(bytes4)). When implementing ERC165, you'll conform to this interface.
- [`ERC165`](api/introspection#erc165) — inherit this contract if you'd like to support interface detection using a lookup table in contract storage. You can register interfaces using [`_registerInterface(bytes4)`](api/introspection#ERC165._registerInterface(bytes4)): check out example usage as part of the ERC721 implementation.
- [`ERC165Checker`](api/introspection#erc165checker) — ERC165Checker simplifies the process of checking whether or not a contract supports an interface you care about.
  - include with `using ERC165Checker for address;`
  - [`myAddress._supportsInterface(bytes4)`](api/introspection#ERC165Checker._supportsInterface(address,bytes4))
  - [`myAddress._supportsAllInterfaces(bytes4[])`](api/introspection#ERC165Checker._supportsAllInterfaces(address,bytes4[]))


```solidity
contract MyContract {
    using ERC165Checker for address;

    bytes4 private InterfaceId_ERC721 = 0x80ac58cd;

    /**
     * @dev transfer an ERC721 token from this contract to someone else
     */
    function transferERC721(
        address token,
        address to,
        uint256 tokenId
    )
        public
    {
        require(token.supportsInterface(InterfaceId_ERC721), "IS_NOT_721_TOKEN");
        IERC721(token).transferFrom(address(this), to, tokenId);
    }
}
```

## Math

The most popular math related library OpenZeppelin provides is [`SafeMath`](api/math#safemath), which provides mathematical functions that protect your contract from overflows and underflows.

Include the contract with `using SafeMath for uint256;` and then call the functions:

- `myNumber.add(otherNumber)`
- `myNumber.sub(otherNumber)`
- `myNumber.div(otherNumber)`
- `myNumber.mul(otherNumber)`
- `myNumber.mod(otherNumber)`

Easy!

## Payment

Want to split some payments between multiple people? Maybe you have an app that sends 30% of art purchases to the original creator and 70% of the profits to the current owner; you can build that with [`PaymentSplitter`](api/payment#paymentsplitter)!

In solidity, there are some security concerns with blindly sending money to accounts, since it allows them to execute arbitrary code. You can read up on these security concerns in the [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/) website. One of the ways to fix reentrancy and stalling problems is, instead of immediately sending Ether to accounts that need it, you can use [`PullPayment`](api/payment#pullpayment), which offers an [`_asyncTransfer`](api/payment#PullPayment._asyncTransfer(address,uint256)) function for sending money to something and requesting that they [`withdrawPayments()`](api/payment#PullPayment.withdrawPayments(address%20payable)) it later.

If you want to Escrow some funds, check out [`Escrow`](api/payment#escrow) and [`ConditionalEscrow`](api/payment#conditionalescrow) for governing the release of some escrowed Ether.

### Misc

Want to check if an address is a contract? Use [`Address`](api/utils#address) and [`Address#isContract()`](api/utils#Address.isContract(address)).

Want to keep track of some numbers that increment by 1 every time you want another one? Check out [`Counter`](api/drafts#counter). This is especially useful for creating incremental ERC721 `tokenId`s like we did in the last section.
