pragma solidity 0.4.24;

import "../ECRecovery.sol";


/**
 * @title BouncerUtils
 * @author Matt Condon (@Shrugs)
 * @dev Provides helpful logic for verifying method parameters.
 * Use this contract if you want to implement your own Bouncer access-control logic that doesn't
 * require delegated signature validity (i.e., if you need a multisig wallet or identity contract to
 * "sign" for things, you need delegated signature validity.)
 *
 * ```solidity
 * using BouncerUtils for bytes32;
 *
 *
 * // require that the `owner` EOA account signs the submitted msg.data
 * // include your custom arguments here if necessary
 * modifier onlyValidMint(address _to, uint256 _amount, bytes _sig) {
 *   require(
 *     keccak256(abi.encodePacked(
 *       address(this),
 *       _to,
 *       _amount
 *     )).toEthSignedMessageHash().recover(_sig) == owner,
 *     "invalid signature"
 *   );
 *   _;
 * }
 *
 * function mint(address _to, uint256 _amount, bytes _sig)
 *   onlyValidMint(_to, _amount, _sig)
 *   public
 * {
 *   // trust arguments
 *   MyToken.mint(_to, _amount);
 * }
 *
 * // or, simpler, if you want to verify all arguments
 *
 * modifier onlyValidTransaction() {
 *  require(
 *    BouncerUtils.signerOfMessageData(address(this)) == owner,
 *    "invalid signature"
 *  );
 * }
 *
 * function mint(address _to, uint256 _amount, bytes _sig)
 *   onlyValidTransaction()
 *   public
 * {
 *   // trust arguments
 *   MyToken.mint(_to, _amount);
 * }
 * ```
 */
library BouncerUtils {
  using ECRecovery for bytes32;

  // method ids are 4 bytes long
  uint constant METHOD_ID_SIZE = 4;
  // signature size is 65 bytes (tightly packed v + r + s), but gets padded to 96 bytes
  uint constant SIGNATURE_SIZE = 96;

  /**
  * @dev recover the signer of the msg.data, assuming all arguments are checked and the last
  * argument is a compact vrs signature, padded to 96 bytes.
  * @return address
  */
  function signerOfMessageData(address _delegate)
    internal
    pure
    returns (address)
  {
    bytes32 hashOfMessageData = keccak256(
      abi.encodePacked(
        _delegate,
        getMessageData()
      )
    );

    return hashOfMessageData
      .toEthSignedMessageHash()
      .recover(
        getSignatureArgument()
      );
  }


  /**
   * @dev Returns the first METHOD_ID_SIZE bytes of msg.data, which is the method signature
   */
  function getMethodId()
    internal
    pure
    returns (bytes)
  {
    bytes memory data = new bytes(METHOD_ID_SIZE);
    for (uint i = 0; i < data.length; i++) {
      data[i] = msg.data[i];
    }

    return data;
  }

  /**
   * @dev returns msg.data, sans the last SIGNATURE_SIZE bytes
   */
  function getMessageData()
    internal
    pure
    returns (bytes)
  {
    require(msg.data.length > SIGNATURE_SIZE);

    bytes memory data = new bytes(msg.data.length - SIGNATURE_SIZE);
    for (uint i = 0; i < data.length; i++) {
      data[i] = msg.data[i];
    }

    return data;
  }

  /**
   * @dev returns the last 96 bytes of msg.data, the compacted vrs signature
   */
  function getSignatureArgument()
    internal
    pure
    returns (bytes)
  {
    require(msg.data.length > SIGNATURE_SIZE);

    bytes memory data = new bytes(SIGNATURE_SIZE);
    for (uint i = msg.data.length - 1; i > data.length; i++) {
      data[i] = msg.data[i];
    }

    return data;
  }
}
