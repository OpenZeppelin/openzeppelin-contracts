pragma solidity ^0.4.23;

import "../ownership/rbac/RBACWithAdmin.sol";


contract RBACMock is RBACWithAdmin {

  string constant ROLE_ADVISOR = "advisor";

  modifier onlyAdminOrAdvisor()
  {
    require(
      hasRole(msg.sender, ROLE_ADMIN) ||
      hasRole(msg.sender, ROLE_ADVISOR)
    );
    _;
  }

  constructor(address[] _advisors)
    public
  {
    addRole(msg.sender, ROLE_ADVISOR);

    for (uint256 i = 0; i < _advisors.length; i++) {
      addRole(_advisors[i], ROLE_ADVISOR);
    }
  }

  function onlyAdminsCanDoThis()
    onlyAdmin
    view
    external
  {
  }

  function onlyAdvisorsCanDoThis()
    onlyRole(ROLE_ADVISOR)
    view
    external
  {
  }

  function eitherAdminOrAdvisorCanDoThis()
    onlyAdminOrAdvisor
    view
    external
  {
  }

  function nobodyCanDoThis()
    onlyRole("unknown")
    view
    external
  {
  }

  // admins can remove advisor's role
  function removeAdvisor(address _addr)
    onlyAdmin
    public
  {
    // revert if the user isn't an advisor
    //  (perhaps you want to soft-fail here instead?)
    checkRole(_addr, ROLE_ADVISOR);

    // remove the advisor's role
    removeRole(_addr, ROLE_ADVISOR);
  }
}
