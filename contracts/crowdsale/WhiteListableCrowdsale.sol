pragma solidity ^0.4.11;

import "../ownership/rbac/RBAC.sol";
import './Crowdsale.sol';


contract WhiteListableCrowdsale is Crowdsale, RBAC {

  string constant ROLE_WHITELISTED_MEMBER = "whitelisted_member";

  modifier onlyWhiteListedMember()
  {
    require(
      hasRole(msg.sender, ROLE_ADMIN) ||
      hasRole(msg.sender, ROLE_WHITELISTED_MEMBER)
    );
    _;
  }

  function WhiteListableCrowdsale(uint256 _whitelistMembers)
    public
  {
    addRole(msg.sender, ROLE_WHITELISTED_MEMBER);

    for (uint256 i = 0; i < _whitelistMembers.length; i++) {
      addRole(_whitelistMembers[i], ROLE_WHITELISTED_MEMBER);
    }
  }

  // admins can add member to white list
  function addMember(address _addr)
    onlyAdmin
    public
  {
    require(!hasRole(_addr, ROLE_WHITELISTED_MEMBER));
    addRole(_addr, ROLE_WHITELISTED_MEMBER);
  }

  // admins can remove white listed member
  function removeMember(address _addr)
    onlyAdmin
    public
  {
    checkRole(_addr, ROLE_WHITELISTED_MEMBER);
    removeRole(_addr, ROLE_WHITELISTED_MEMBER);
  }
}
