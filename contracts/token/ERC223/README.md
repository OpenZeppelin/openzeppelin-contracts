# ERC223 token standard.
Forked from [Dexaran](https://github.com/Dexaran/ERC23-tokens.git)'s repository. Improved by [ProphetDaniel](https://github.com/ProphetDaniel).

ERC223 is a modification of ERC20 token standard.

### The main goals of developing ERC223 token standard were:
  1. Accidentally lost tokens inside contracts: there are two different ways to transfer ERC20 tokens depending on is the receiver address a contract or a wallet address. You should call `transfer` to send tokens to a wallet address or call `approve` on token contract then `transferFrom` on receiver contract to send tokens to contract. Accidentally call of `transfer` function to a contract address will cause a loss of tokens inside receiver contract where tokens will never be accessibe.
  2. Inability of handling incoming token transactions: ERC20 token transaction is a call of `transfer` function inside token contract. ERC20 token contract is not notifying receiver that transaction occurs. Also there is no way to handle incoming token transactions on contract and no way to reject any non-supported tokens.
  3. ERC20 token transaction between wallet address and contract is a couple of two different transactions in fact: You should call `approve` on token contract and then call `transferFrom` on another contract when you want to deposit your tokens intor it.
  4. Ether transactions and token transactions behave different: one of the goals of developing ERC223 was to make token transactions similar to Ether transactions to avoid users mistakes when transferring tokens and make interaction with token transactions easier for contract developers.
  
### ERC223 advantages.
  1. Provides a possibility to avoid accidentally lost tokens inside contracts that are not designed to work with sent tokens.
  2. Allows users to send their tokens anywhere with one function `transfer`. No difference between is the receiver a contract or not. No need to learn how token contract is working for regular user to send tokens.
  3. Allows contract developers to handle incoming token transactions.
  4. ERC223 `transfer` to contract consumes 2 times less gas than ERC20 `approve` and `transferFrom` at receiver contract.
  5. Allows to deposit tokens intor contract with a single transaction. Prevents extra blockchain bloating. 
  6. Makes token transactions similar to Ether transactions.
  
  ERC223 tokens are backwards compatible with ERC20 tokens. It means that ERC223 supports every ERC20 functional and contracts or services working with ERC20 tokens will work with ERC223 tokens correctly.
ERC223 tokens should be sent by calling `transfer` function on token contract with no difference is receiver a contract or a wallet address. If the receiver is a wallet ERC223 token transfer will be same to ERC20 transfer. If the receiver is a contract ERC223 token contract will try to call `tokenFallback` function on receiver contract. If there is no `tokenFallback` function on receiver contract transaction will fail. `tokenFallback` function is analogue of `fallback` function for Ether transactions. It can be used to handle incoming transactions. There is a way to attach `bytes _data` to token transaction similar to `_data` attached to Ether transactions. It will pass through token contract and will be handled by `tokenFallback` function on receiver contract. There is also a way to call `transfer` function on ERC223 token contract with no data argument or using ERC20 ABI with no data on `transfer` function. In this case `_data` will be empty bytes array.

ERC223 EIP https://github.com/ethereum/EIPs/issues/223
ERC20 EIP https://github.com/ethereum/EIPs/issues/20

 ### Lost tokens held by contracts
There is already a number of tokens held by token contracts themselves. This tokens will not be accessible as there is no function to withdraw them from contract. This tokens are **lost**.

244131 GNT in Golem contract ~ $54333:
https://etherscan.io/token/Golem?a=0xa74476443119a942de498590fe1f2454d7d4ac0d

200 REP in Augur contract ~ $3292:
https://etherscan.io/token/REP?a=0x48c80f1f4d53d5951e5d5438b54cba84f29f32a5

777 DGD in Digix DAO contract ~ $7500:
https://etherscan.io/token/0xe0b7927c4af23765cb51314a0e0521a9645f0e2a?a=0xe0b7927c4af23765cb51314a0e0521a9645f0e2a

10150  1ST in FirstBlood contract ~ $3466:
https://etherscan.io/token/FirstBlood?a=0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7
  
30 MLN in Melonport contract ~ $1197:
https://etherscan.io/token/Melon?a=0xBEB9eF514a379B997e0798FDcC901Ee474B6D9A1+
