ECRecovery
=============================================

Returns the signer of the hash using the signature divided in v, r, and s values.

recover(bytes32 hash, bytes sig) internal returns (address)
"""""""""""""""""""""""""""""""""""""""""""""""""

Returns the signer of the the hash using the signature that provides the web3.eth.sign() method.
