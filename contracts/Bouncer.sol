pragma solidity ^0.4.18;

import "./ownership/rbac/RBACOwnable.sol";
import "./ECRecovery.sol";

/**
 * @title Bouncer
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
contract Bouncer is RBACOwnable {
  using ECRecovery for bytes32;


  event BouncerAdded(address indexed _bouncer);
  event BouncerRemoved(address indexed _bouncer);


  string public constant ROLE_BOUNCER = "bouncer";


  modifier onlyValidSignature(bytes _sig)
  {
    require(isValidSignature(msg.sender, _sig));
    _;
  }

  function addBouncer(address _bouncer)
    onlyOwner
    onlyValidAddress(_bouncer)
    public
  {
    addRole(_bouncer, ROLE_BOUNCER);
    BouncerAdded(_bouncer);
  }

  function removeBouncer(address _bouncer)
    onlyOwner
    onlyValidAddress(_bouncer)
    public
  {
    removeRole(_bouncer, ROLE_BOUNCER);
    BouncerRemoved(_bouncer);
  }

  function isValidSignature(address _address, bytes _sig)
    internal
    view
    returns (bool)
  {
    return hasRole(
      keccak256(
        "\x19Ethereum Signed Message:\n32",
        keccak256(address(this), _address)
      ).recover(_sig),
      ROLE_BOUNCER
    );
  }
}
