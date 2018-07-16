pragma solidity ^0.4.24;

import "../introspection/ERC165Checker.sol";
import "./IBouncerDelegate.sol";
import "./BouncerDelegate.sol";
import "../ownership/rbac/RBACOwnable.sol";
import "../ECRecovery.sol";


/**
 * @title Bouncer
 * @author PhABC, Shrugs and aflesher
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
contract Bouncer is RBACOwnable, BouncerDelegate {
  using ECRecovery for bytes32;
  using ERC165Checker for address;

  string public constant ROLE_DELEGATE = "delegate";

  // method ids are 4 bytes long
  uint constant METHOD_ID_SIZE = 4;
  // signature size is 65 bytes (tightly packed v + r + s), but gets padded to 96 bytes
  uint constant SIGNATURE_SIZE = 96;

  /**
   * @dev requires that a valid signature of a bouncer was provided
   * @notice does not validate method arguments
   */
  modifier onlyValidTicket(address _delegate, bytes _sig)
  {
    require(isValidTicket(_delegate, msg.sender, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method of a bouncer was provided
   * @notice validates methodId, but not method arguments
   */
  modifier onlyValidTicketForMethod(address _delegate, bytes _sig)
  {
    require(isValidTicketAndMethod(_delegate, msg.sender, _sig));
    _;
  }

  /**
   * @dev requires that a valid signature with a specifed method and params of a bouncer was provided
   * @notice verifies entire calldata, sans final signature
   */
  modifier onlyValidTicketForData(address _delegate, bytes _sig)
  {
    require(isValidTicketAndData(_delegate, msg.sender, _sig));
    _;
  }

  constructor()
    public
  {
    // this contract implements IBouncerDelegate for all of its EOA delegate accounts.
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
   * @dev is the signature of `this + sender` from a bouncer?
   * @return bool
   */
  function isValidTicket(address _delegate, address _sender, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isDelegatedSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate, _sender)),
      _sig
    );
  }

  /**
   * @dev is the signature of `this + sender + methodId` from a bouncer?
   * @return bool
   */
  function isValidTicketAndMethod(address _delegate, address _sender, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isDelegatedSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate, _sender, getMethodId())),
      _sig
    );
  }

  /**
    * @dev is the signature of `this + sender + methodId + params(s)` from a bouncer?
    * @notice the _sig parameter of the method being validated must be the "last" parameter
    * @return bool
    */
  function isValidTicketAndData(address _delegate, address _sender, bytes _sig)
    internal
    view
    returns (bool)
  {
    return isDelegatedSignatureValidForHash(
      _delegate,
      keccak256(abi.encodePacked(_delegate, _sender, getMessageData())),
      _sig
    );
  }

  /**
   * @dev tests to see if the signature is valid according to the delegate
   * The delegate address must either be this contract or have the delegate role AND support isValidSignature
   * This allows someone who wants custom validation logic (perhaps they check another contract's state)
   * to code their own delegate. The users then submit signatures to the Bouncer,
   * which then pings back to the delegate to check if it's cool.
   * This is also useful for contracts-as-identities: your identity contract implements
   * isValidTicket and can then recover the signer and check it against the whitelisted ACTION keys.
   * @return bool is the ticket valid
   */
  function isDelegatedSignatureValidForHash(address _delegate, bytes32 _hash, bytes _sig)
    internal
    view
    returns (bool)
  {
    bool isDelegate = hasRole(_delegate, ROLE_DELEGATE);
    bool hasInterface = msg.sender.supportsInterface(InterfaceId_BouncerDelegate);

    if (isDelegate && hasInterface) {
      return IBouncerDelegate(_delegate).isValidSignature(_hash, _sig);
    }
  }

  /**
   * @dev implement `isValidSignature` of IBouncerDelegate for EOA accounts that have the delegate role
   */
  function isValidSignature(
    bytes32 _hash,
    bytes _sig
  )
    public
    view
    returns (bool)
  {
    address signer = _hash
      .toEthSignedMessageHash()
      .recover(_sig);
    return hasRole(signer, ROLE_DELEGATE);
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
}
