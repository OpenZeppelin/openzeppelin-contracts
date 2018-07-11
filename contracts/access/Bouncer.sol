pragma solidity ^0.4.24;

import "../introspection/ERC165Checker.sol";
import "./IBouncerDelegate.sol";
import "../ownership/rbac/RBACOwnable.sol";
import "../ownership/rbac/RBAC.sol";
import "../ECRecovery.sol";


/**
 * @title Bouncer
 * @author PhABC, Shrugs and aflesher
 * @dev Bouncer allows users to submit a `ticket` from a `delegate` as a permission to do an action.
 * A ticket is a cryptographic signature generated via
 * Ethereum ECDSA signing (web3.eth.personal_sign).
 * Tickets must be a signature (with `Ethereum Signed Message:` prefix) of the hash of the verified
 * information. See //test/helpers/sign.js for example ticket construction.
 *
 * If the ticket is from one of the authorized delegates, the ticket
 * is valid. The owner of the contract adds/removes delegates.
 * Delegates can be individual servers signing grants or different
 * users within a decentralized club that have permission to invite other members.
 * Delegates can also be other contracts that implement `isValidSignature`, allowing you to write
 * whatever access-control logic you want, like using alternative signature schemes.
 *
 * This technique is useful for whitelists and airdrops; instead of putting all
 * valid addresses on-chain, simply sign a grant of the form
 * keccak256(abi.encodePacked(`:contractAddress` + `:granteeAddress`)) using a valid signer.
 *
 * Then restrict access to your crowdsale/whitelist/airdrop using the `onlyValidSignatureAndData`
 * modifier, which allows users claiming your tokens to pay their own gas.
 *
 * @notice A method that uses the `onlyValidSignatureAndData` modifier must make the _sig
 * parameter the "last" parameter. You cannot sign a message that has its own
 * signature in it so the last 128 bytes of msg.data (which represents the
 * length of the _sig data and the _sig data itself) is ignored when validating.
 * Also non fixed sized parameters make constructing the data in the signature
 * much more complex. See https://ethereum.stackexchange.com/a/50616 for more details.
 */
contract Bouncer is RBACOwnable {
  using ECRecovery for bytes32;
  using ERC165Checker for address;

  // @TODO - de-duplicate this line from IBouncerDelegate once sharing constants is possible
  bytes4 internal constant InterfaceId_BouncerDelegate = 0x1626ba7e;
  string public constant ROLE_DELEGATE = "delegate";
  uint constant METHOD_ID_SIZE = 4;
  // signature size is 65 bytes (tightly packed v + r + s), but gets padded to 96 bytes
  uint constant SIGNATURE_SIZE = 96;

  /**
   * @dev requires that a valid signature of a bouncer was provided
   * @notice does not validate method arguments
   */
  modifier onlyValidSignature(bytes _sig)
  {
    require(isValidSignature(msg.sender, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method of a bouncer was provided
   * @notice validates methodId, but not method arguments
   */
  modifier onlyValidSignatureAndMethod(bytes _sig)
  {
    require(isValidSignatureAndMethod(msg.sender, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method and params of a bouncer was provided
   * @notice verifies entire calldata
   */
  modifier onlyValidSignatureAndData(bytes _sig)
  {
    require(isValidSignatureAndData(msg.sender, _sig));
    _;
  }

  /**
   * @dev allows the owner to add additional signer addresses
   */
  function addDelegate(address _delegate)
    onlyOwner
    public
  {
    require(_delegate != address(0));
    addRole(_delegate, ROLE_DELEGATE);
  }

  /**
   * @dev allows the owner to remove signer addresses
   */
  function removeDelegate(address _delegate)
    onlyOwner
    public
  {
    require(_delegate != address(0));
    removeRole(_delegate, ROLE_DELEGATE);
  }

  /**
   * @dev is the signature of `this + sender` from a bouncer?
   * @return bool
   */
  function isValidSignature(address _address, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isValidDataHash(
      keccak256(abi.encodePacked(address(this), _address)),
      _sig
    );
  }

  /**
   * @dev is the signature of `this + sender + methodId` from a bouncer?
   * @return bool
   */
  function isValidSignatureAndMethod(address _address, bytes _sig)
    internal
    view
    returns (bool)
  {
    bytes memory data = new bytes(METHOD_ID_SIZE);
    for (uint i = 0; i < data.length; i++) {
      data[i] = msg.data[i];
    }
    return isValidDataHash(
      keccak256(abi.encodePacked(address(this), _address, data)),
      _sig
    );
  }

  /**
    * @dev is the signature of `this + sender + methodId + params(s)` from a bouncer?
    * @notice the _sig parameter of the method being validated must be the "last" parameter
    * @return bool
    */
  function isValidSignatureAndData(address _address, bytes _sig)
    internal
    view
    returns (bool)
  {
    require(msg.data.length > SIGNATURE_SIZE);
    bytes memory data = new bytes(msg.data.length - SIGNATURE_SIZE);
    for (uint i = 0; i < data.length; i++) {
      data[i] = msg.data[i];
    }
    return isValidDataHash(
      keccak256(abi.encodePacked(address(this), _address, data)),
      _sig
    );
  }

  /**
   * @dev internal function to convert a hash to an eth signed message
   * and then recover the signature and check it against the bouncer role
   * @return bool
   */
  function isValidDataHash(bytes32 _hash, bytes _sig)
    internal
    view
    returns (bool)
  {
    // if the sender is a delegate AND supports isValidSignature, we delegate validation to them
    // this allows someone who wants custom validation logic (perhaps they check another contract's state)
    // to code their own delegate. The users then submit actions to the delegate contract, which proxies
    // them to this contract, which then pings-back to check if it's cool.
    // This is also useful for contracts-as-identities: your identity contract implements isValidSignature
    // and can then recover the signer and check it against the whitelisted ACTION keys.
    if (hasRole(msg.sender, ROLE_DELEGATE) && msg.sender.supportsInterface(InterfaceId_BouncerDelegate)) {
      return IBouncerDelegate(msg.sender).isValidSignature(_hash, _sig);
    }

    // otherwise it's an ECDSA Ethereum Signed Message hash,
    // so recover and check the signer's delegate status
    address signer = _hash
      .toEthSignedMessageHash()
      .recover(_sig);
    return hasRole(signer, ROLE_DELEGATE);
  }
}
