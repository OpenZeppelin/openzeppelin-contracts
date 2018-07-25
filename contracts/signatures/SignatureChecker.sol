pragma solidity 0.4.24;

import "../ownership/rbac/RBACOwnable.sol";
import "./ISignatureDelegate.sol";
import "./SignatureDelegate.sol";
import "../ECRecovery.sol";
import "../introspection/ERC165Checker.sol";


contract SignatureChecker is RBACOwnable, SignatureDelegate {
  using ECRecovery for bytes32;
  using ERC165Checker for address;

  string public constant ROLE_DELEGATE = "delegate";

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
   * @dev tests to see if the signature is valid according to the delegate
   * The delegate address must have the delegate role AND support isValidSignature
   * This allows someone who wants custom validation logic (perhaps they check another contract's state)
   * to code their own delegate. The users then submit signatures to the Bouncer,
   * which then pings back to the delegate to check if it's cool.
   * This is also useful for contracts-as-identities: your identity contract implements
   * isValidTicket and can then recover the signer and check it against the whitelisted ACTION keys.
   * @return bool validity of the signature
   */
  function isDelegatedSignatureValidForHash(address _delegate, bytes32 _hash, bytes _sig)
    internal
    view
    returns (bool)
  {
    bool isDelegate = hasRole(_delegate, ROLE_DELEGATE);
    bool hasInterface = _delegate.supportsInterface(InterfaceId_SignatureDelegate);

    if (isDelegate && hasInterface) {
      return ISignatureDelegate(_delegate).isValidSignature(_hash, _sig);
    }

    // delegate is invalid, so signature is invalid as well
    return false;
  }

  /**
   * @dev implement `isValidSignature` of ISignatureDelegate for EOA accounts that have the delegate role
   */
  function isValidSignature(
    bytes32 _hash,
    bytes _sig
  )
    public
    view
    returns (bool)
  {
    address signer = _hash.toEthSignedMessageHash().recover(_sig);
    return hasRole(signer, ROLE_DELEGATE);
  }
}
