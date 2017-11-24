pragma solidity ^0.4.8;

import '../ownership/rbac/RBAC.sol';


contract RBACExample is RBAC {

    modifier onlyOwnerOrAdvisor()
    {
        require(
            hasRole(msg.sender, "owner") ||
            hasRole(msg.sender, "advisor")
        );
        _;
    }

    function RBACExample(address[] _advisors)
        public
    {
        addRole(msg.sender, "owner");
        addRole(msg.sender, "advisor");

        for (uint256 i = 0; i < _advisors.length; i++) {
            addRole(_advisors[i], "advisor");
        }
    }

    function onlyOwnersCanDoThis()
        onlyRole("owner")
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

    function eitherOwnerOrAdvisorCanDoThis()
        onlyOwnerOrAdvisor
        view
        external
    {
    }

    // owners can remove advisor's role
    function removeAdvisor(address _addr)
        onlyRole("owner")
        public
    {
        // revert if the user isn't an advisor
        //  (perhaps you want to soft-fail here instead?)
        checkRole(_addr, "advisor");

        // remove the advisor's role
        removeRole(_addr, "advisor");
    }
}
