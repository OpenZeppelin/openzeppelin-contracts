pragma solidity ^0.4.8;

import '../../contracts/ownership/rbac/RBAC.sol';


contract RBACMock is RBAC {

    modifier onlyAdminOrAdvisor()
    {
        require(
            hasRole(msg.sender, "admin") ||
            hasRole(msg.sender, "advisor")
        );
        _;
    }

    function RBACMock(address[] _advisors)
        public
    {
        addRole(msg.sender, "admin");
        addRole(msg.sender, "advisor");

        for (uint256 i = 0; i < _advisors.length; i++) {
            addRole(_advisors[i], "advisor");
        }
    }

    function onlyAdminsCanDoThis()
        onlyRole("admin")
        view
        external
    {
    }

    function onlyAdvisorsCanDoThis()
        onlyRole("advisor")
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
        checkRole(_addr, "advisor");

        // remove the advisor's role
        removeRole(_addr, "advisor");
    }
}
