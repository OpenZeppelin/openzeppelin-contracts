pragma solidity ^0.8.20;

import {AccessControl} from "../../openzeppelin-contracts/contracts/access/AccessControl.sol";
import {IAccessControl} from "../../openzeppelin-contracts/contracts/access/IAccessControl.sol";

contract MyAccessControl is AccessControl {

    constructor() {
        AccessControl._grantRole(0x0, msg.sender);
    }

    //检测当前合约是否实现了ERC165标准
    function supportsInterface() public returns(bool) {
        return AccessControl.supportsInterface(type(IAccessControl).interfaceId);
    }

    //为某个role角色设置adminRole
    function SetRoleAdmin(bytes32 role, bytes32 adminRole) public {
        AccessControl._setRoleAdmin(role, adminRole);
    }

    function GetRoleAdmin(bytes32 role) public returns(bytes32) {
        return AccessControl.getRoleAdmin(role);
    }

    //为某个账户设置某个角色
    function GrantRole(bytes32 role, address account) public{
        return AccessControl.grantRole(role, account);
    }

    //判断某个账户是否有某个角色
    function HasRole(bytes32 role, address account) public returns(bool) {
        return AccessControl.hasRole(role, account);
    }

    //为某个账户撤销某个角色
    function RevokeRole(bytes32 role, address account) public {
        AccessControl._revokeRole(role, account);
    }

    //合约所有者主动放弃某个角色
    function RenounceRole(bytes32 role, address callerConfirmation) public {
        AccessControl.renounceRole(role, callerConfirmation);
    }
}