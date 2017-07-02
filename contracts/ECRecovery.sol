pragma solidity ^0.4.11;


/**
 * @title Eliptic curve signature operations
 *
 * @dev Based on https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d
 */

library ECRecovery {

  /**
   * @dev Duplicate Solidity's ecrecover, but catching the CALL return value
   * @param hash bytes32 messahe hash from which the signature will be recovered
   * @param v uint8 signature version
   * @param r bytes32 signature r value
   * @param s bytes32 signature s value
   */
  function safeRecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) constant returns (bool, address) {
    // We do our own memory management here. Solidity uses memory offset
    // 0x40 to store the current end of memory. We write past it (as
    // writes are memory extensions), but don't update the offset so
    // Solidity will reuse it. The memory used here is only needed for
    // this context.

    bool ret;
    address addr;

    assembly {
      let size := mload(0x40)
      mstore(size, hash)
      mstore(add(size, 32), v)
      mstore(add(size, 64), r)
      mstore(add(size, 96), s)

      // NOTE: we can reuse the request memory because we deal with
      //       the return code
      ret := call(3000, 1, 0, size, 128, size, 32)
      addr := mload(size)
    }

    return (ret, addr);
  }

  /**
   * @dev Recover signer address from a message by using his signature
   * @param hash bytes32 messahe hash from which the signature will be recovered
   * @param sig bytes signature
   */
  function recover(bytes32 hash, bytes sig) constant returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    if (sig.length != 65)
      return (address(0));

    assembly {
      r := mload(add(sig, 32))
      s := mload(add(sig, 64))
      v := byte(0, mload(add(sig, 96)))
    }

    // albeit non-transactional signatures are not specified by the YP, one would expect it
    // to match the YP range of [27, 28]
    //
    // geth uses [0, 1] and some clients have followed. This might change, see:
    //  https://github.com/ethereum/go-ethereum/issues/2053
    if (v < 27)
     v += 27;

    if (v != 27 && v != 28)
      return (address(0));

    bool ret;
    address addr;
    (ret, addr) = safeRecover(hash, v, r, s);

    if (!ret)
      return address(0);
    else
      return addr;
  }

}
