pragma solidity ^0.4.24;

import "../ownership/rbac/RBACOwnable.sol";
import "../ECRecovery.sol";
import "./BouncerUtils.sol";
import "../signatures/SignatureDelegate.sol";


/**
 * @title Bouncer
 * @author PhABC, Shrugs, and aflesher
 * @dev Bouncer allows users to submit a `ticket` from a `delegate` as a permission to do an action.
 * By default a `ticket` is a cryptographic signature
 * generated via Ethereum ECDSA signing (web3.eth.personal_sign).
 * See //test/helpers/sign.js for example ticket construction.
 *
 * If the ticket is from one of the authorized delegates, the ticket is valid.
 The owner of the contract adds/removes delegates.
 *
 * Delegates can be individual servers signing grants or different
 * users within a decentralized club that have permission to invite other members.
 *
 * Delegates can also be other contracts that implement `isValidSignature`, allowing you to write
 * whatever access-control logic you want, like using alternative signature schemes or
 * contract-as-identity patterns.
 *
 * This Bouncer technique is useful for whitelists and airdrops; instead of putting all
 * valid addresses on-chain, simply sign a grant of the form
 * keccak256(abi.encodePacked(`:delegate` + `:sender`)) using a valid signer.
 *
 * Then restrict access to your crowdsale/whitelist/airdrop using one of the only* modifiers,
 * which allows users claiming your tokens to pay their own gas.
 *
 * @notice A method that uses the `onlyValidTicketForData` modifier must make the _sig
 * parameter the "last" parameter. You cannot sign a message that has its own
 * signature in it so the last 96 bytes of msg.data (which represents the _sig data itself)
 * is ignored when constructing the data hash that is validated.
 */
contract Bouncer is RBACOwnable, SignatureDelegate {
  using ECRecovery for bytes32;
  using BouncerUtils for bytes32;

  string public constant ROLE_DELEGATE = "delegate";

  /**
   * @dev requires that a valid signature of a bouncer was provided
   * @notice does not validate method arguments
   */
  modifier onlyValidTicket(address _delegate, bytes _sig)
  {
    require(isValidTicket(_delegate, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method of a bouncer was provided
   * @notice validates methodId, but not method arguments
   */
  modifier onlyValidTicketForMethod(address _delegate, bytes _sig)
  {
    require(isValidTicketAndMethod(_delegate, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method and params of a bouncer was provided
   * @notice verifies entire calldata, sans final signature
   */
  modifier onlyValidTicketForData(address _delegate, bytes _sig)
  {
    require(isValidTicketAndData(_delegate, _sig));
    _;
  }


  constructor()
    public
  {
    // this contract implements ISignatureDelegate for all of its EOA delegate accounts.
    addRole(address(this), ROLE_DELEGATE);
  }

  /**
   * @dev allows the owner to add additional signer addresses
   */
  function addDelegate(address _delegate)
    onlyOwners
    public
  {
    require(_delegate != address(0));
    addRole(_delegate, ROLE_DELEGATE);
  }

  /**
   * @dev allows the owner to remove signer addresses
   */
  function removeDelegate(address _delegate)
    onlyOwners
    public
  {
    require(_delegate != address(0));
    removeRole(_delegate, ROLE_DELEGATE);
  }

  /**
   * @dev is the signature of `delegate + sender` from a bouncer?
   * @return bool
   */
  function isValidTicket(address _delegate, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate)),
      _sig
    );
  }

  /**
   * @dev is the signature of `delegate + sender + methodId` from a bouncer?
   * @return bool
   */
  function isValidTicketAndMethod(address _delegate, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate, BouncerUtils.getMethodId())),
      _sig
    );
  }

  /**
    * @dev is the signature of `delegate + sender + msg.data` from a bouncer?
    * @notice the _sig parameter of the method being validated must be the "last" parameter
    * @return bool
    */
  function isValidTicketAndData(address _delegate, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate, BouncerUtils.getMessageData())),
      _sig
    );
  }

  function isSignatureValidForHash(address _delegate, bytes32 _hash, bytes _sig)
    internal
    view
    returns (bool)
  {
    bool isDelegate = hasRole(_delegate, ROLE_DELEGATE);
    return isDelegate && _hash.isSignedBy(_delegate, _sig);
  }

  function isValidSignature(
    bytes32 _hash,
    bytes _sig
  )
    public
    view
    returns (bool)
  {
    return hasRole(
      _hash.toEthSignedMessageHash().recover(_sig),
      ROLE_DELEGATE
    );
  }
}
