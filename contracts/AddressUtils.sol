pragma solidity ^0.4.24;

import "./ECRecovery.sol";

/**
 * Utility library of inline functions on addresses
 */
library AddressUtils {

  using ECRecovery for ECRecovery.recover;

  /**
   * Returns whether the target address is a contract
   * @dev This function will return false if invoked during the constructor of a contract,
   * as the code is not actually created until after the constructor finishes. For more info
   * see https://ethereum.stackexchange.com/a/14016/36603
   * @param addr address to check
   * @return whether the target address is a contract
   */
  function isContract(address addr) internal view returns (bool) {
    uint256 size;
  
    // TODO Check this again before the Serenity release, because all addresses will be
    // contracts then.
    // solium-disable-next-line security/no-inline-assembly
    assembly { size := extcodesize(addr) }
    return size > 0;
  }

  /**
   * Returns whether the target address is a contract safely by checking the ECDSA signature 
   * for a private key, which contracts do not have
   * @dev securely check if an address is a contract
   * @param addr address to check
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param sig bytes signature, the signature is generated using web3.eth.sign()
   * @return whether the target address is a contract
   */
  function safeIsContract(address addr, bytes32 hash, bytes sig) internal view returns (bool) {
    return ECRecovery.recover(hash, sig) == addr;
  }

}
