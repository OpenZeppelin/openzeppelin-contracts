ECReovery
=============================================

Recover the signer address of messages using elliptic curve signatures.

safeRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal returns (bool, address)
"""""""""""""""""""""""""""""""""""""""""""""""""

Returns the signer of the the hash using the signature divided in v, r, and s values.

recover(bytes32 hash, bytes sig) internal returns (address)
"""""""""""""""""""""""""""""""""""""""""""""""""

Returns the signer of the the hash using the signature that provides the web3.sign() method.
