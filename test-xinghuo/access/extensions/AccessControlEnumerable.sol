pragma solidity ^0.8.20;

import {AccessControlEnumerable} from "../../../openzeppelin-contracts/contracts/access/extensions/AccessControlEnumerable.sol";
import {IAccessControlEnumerable} from "../../../openzeppelin-contracts/contracts/access/extensions/IAccessControlEnumerable.sol";

contract MyAccessControlEnumerable is AccessControlEnumerable {
    function supportsInterface() public returns(bool) {
        return AccessControlEnumerable.supportsInterface(type(IAccessControlEnumerable).interfaceId);
    }

    //为某个账户设置某个角色
    function GrantRole(bytes32 role, address account) public returns(bool){
        return _grantRole(role, account);
    }

    //为某个账户撤销某个角色
    function RevokeRole(bytes32 role, address account) public returns(bool){
        return _revokeRole(role, account);
    }

    function GetRoleMember(bytes32 role, uint256 index) public returns(address){
        return getRoleMember(role, index);
    }

    function GetRoleMemberCount(bytes32 role) public returns(uint256){
        return getRoleMemberCount(role);
    }

}