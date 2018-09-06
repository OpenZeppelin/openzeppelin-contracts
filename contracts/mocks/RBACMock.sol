pragma solidity ^0.4.24;

import "../examples/RBACWithAdmin.sol";


contract RBACMock is RBACWithAdmin {

  string private constant _ROLE_ADVISOR = "advisor";

  modifier onlyAdminOrAdvisor()
  {
    require(
      isAdmin(msg.sender) ||
      hasRole(msg.sender, _ROLE_ADVISOR)
    );
    _;
  }

  constructor(address[] advisors)
    public
  {
    _addRole(msg.sender, _ROLE_ADVISOR);

    for (uint256 i = 0; i < advisors.length; i++) {
      _addRole(advisors[i], _ROLE_ADVISOR);
    }
  }

  function onlyAdminsCanDoThis()
    external
    onlyAdmin
    view
  {
  }

  function onlyAdvisorsCanDoThis()
    external
    onlyRole(_ROLE_ADVISOR)
    view
  {
  }

  function eitherAdminOrAdvisorCanDoThis()
    external
    onlyAdminOrAdvisor
    view
  {
  }

  function nobodyCanDoThis()
    external
    onlyRole("unknown")
    view
  {
  }

  // admins can remove advisor's role
  function removeAdvisor(address account)
    public
    onlyAdmin
  {
    // revert if the user isn't an advisor
    //  (perhaps you want to soft-fail here instead?)
    checkRole(account, _ROLE_ADVISOR);

    // remove the advisor's role
    _removeRole(account, _ROLE_ADVISOR);
  }
}
