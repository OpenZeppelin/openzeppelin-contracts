pragma solidity ^0.4.18;

import "../ownership/Ownable.sol";
import "../ownership/rbac/RBAC.sol";
import "../ECRecovery.sol";


/**
 * @title SignatureBouncer
 * @author PhABC and Shrugs
 * @dev Bouncer allows users to submit a signature as a permission to do an action.
 * @dev If the signature is from one of the authorized bouncer addresses, the signature
 * @dev is valid. The owner of the contract adds/removes bouncers.
 * @dev Bouncer addresses can be individual servers signing grants or different
 * @dev users within a decentralized club that have permission to invite other members.
 * @dev
 * @dev This technique is useful for whitelists and airdrops; instead of putting all
 * @dev valid addresses on-chain, simply sign a grant of the form
 * @dev keccak256(`:contractAddress` + `:granteeAddress`) using a valid bouncer address.
 * @dev Then restrict access to your crowdsale/whitelist/airdrop using the
 * @dev `onlyValidSignature` modifier (or implement your own using isValidSignature).
 * @dev
 * @dev See the tests Bouncer.test.js for specific usage examples.
 */
contract SignatureBouncer is Migratable, Ownable, RBAC {
  using ECRecovery for bytes32;

  string public constant ROLE_BOUNCER = "bouncer";

  function initialize(address _sender)
    isInitializer("SignatureBouncer", "1.9.0")
    public
  {
    Ownable.initialize(_sender);
  }

  /**
   * @dev requires that a valid signature of a bouncer was provided
   */
  modifier onlyValidSignature(bytes _sig)
  {
    require(isValidSignature(msg.sender, _sig));
    _;
  }

  /**
   * @dev allows the owner to add additional bouncer addresses
   */
  function addBouncer(address _bouncer)
    onlyOwner
    public
  {
    require(_bouncer != address(0));
    addRole(_bouncer, ROLE_BOUNCER);
  }

  /**
   * @dev allows the owner to remove bouncer addresses
   */
  function removeBouncer(address _bouncer)
    onlyOwner
    public
  {
    require(_bouncer != address(0));
    removeRole(_bouncer, ROLE_BOUNCER);
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
      keccak256(address(this), _address),
      _sig
    );
  }

  /**
   * @dev internal function to convert a hash to an eth signed message
   * @dev and then recover the signature and check it against the bouncer role
   * @return bool
   */
  function isValidDataHash(bytes32 hash, bytes _sig)
    internal
    view
    returns (bool)
  {
    address signer = hash
      .toEthSignedMessageHash()
      .recover(_sig);
    return hasRole(signer, ROLE_BOUNCER);
  }
}
