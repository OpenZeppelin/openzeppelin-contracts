pragma solidity ^0.8.20;

contract TestContract {
    //test function
    function testA() public {

    }

    function testB(bool ret) public returns(bool) {
        return ret;
    }
}

import {AccessManager} from "../../../openzeppelin-contracts/contracts/access/manager/AccessManager.sol";

contract MyAccessManager {
    AccessManager manager;

    constructor() {
        manager = new AccessManager(address(this));
    }

    function expiration() public returns (uint32) {
        return manager.expiration();
    }

    function minSetback() public returns (uint32) {
        return manager.minSetback();
    }

    function isTargetClosed(address target) public returns (bool) {
        return manager.isTargetClosed(target);
    }

    function getTargetFunctionRole(address target, bytes4 selector) public returns (uint64) {
        return manager.getTargetFunctionRole(target, selector);
    }

    function getTargetAdminDelay(address target) public returns (uint32) {
        return manager.getTargetAdminDelay(target);
    }

    function getRoleAdmin(uint64 roleId) public returns (uint64) {
        return manager.getRoleAdmin(roleId);
    }

    function getRoleGuardian(uint64 roleId) public returns (uint64) {
        return manager.getRoleGuardian(roleId);
    }

    function getRoleGrantDelay(uint64 roleId) public returns (uint32) {
        return manager.getRoleGrantDelay(roleId);
    }

    function getAccess(
        uint64 roleId,
        address account
    ) public returns (uint48, uint32, uint32, uint48) {
        return manager.getAccess(roleId, account);
    }

    function hasRole(
        uint64 roleId,
        address account
    ) public returns (bool, uint32) {
        return manager.hasRole(roleId, account);
    }

    function labelRole(uint64 roleId, string calldata label) public {
        manager.labelRole(roleId, label);
    }

    function grantRole(uint64 roleId, address account, uint32 executionDelay) public {
        manager.grantRole(roleId, account, executionDelay);
    }

    function revokeRole(uint64 roleId, address account) public {
        manager.revokeRole(roleId, account);
    }

    //由放弃角色的账户自己调用该接口
    function renounceRole(uint64 roleId, address callerConfirmation) public {
        manager.renounceRole(roleId, callerConfirmation);
    }

    function setRoleAdmin(uint64 roleId, uint64 admin) public {
        manager.setRoleAdmin(roleId, admin);
    }

    function setRoleGuardian(uint64 roleId, uint64 guardian) public {
        manager.setRoleGuardian(roleId, guardian);
    }

    function setGrantDelay(uint64 roleId, uint32 newDelay) public {
        manager.setGrantDelay(roleId, newDelay);
    }

    //调用该接口前，先部署TestContract合约
    function setTargetFunctionRole(
        address target,
        bytes4[] memory selectors,
        uint64 roleId
    ) public {
        manager.setTargetFunctionRole(target, selectors, roleId);
    }

    function setTargetAdminDelay(address target, uint32 newDelay) public {
        manager.setTargetAdminDelay(target, newDelay);
    }

    function setTargetClosed(address target, bool closed) public {
        manager.setTargetClosed(target, closed);
    }

    function getSchedule(bytes32 id) public returns (uint48) {
        return manager.getSchedule(id);
    }

    function getNonce(bytes32 id) public returns (uint32) {
        return manager.getNonce(id);
    }

    function schedule(
        address target,
        bytes calldata data,
        uint48 when
    ) public virtual returns (bytes32, uint32) {
        return manager.schedule(target, data, when);
    }

    function execute(address target, bytes calldata data) public payable returns (uint32) {
        return manager.execute(target, data);
    }

    function cancel(address caller, address target, bytes memory data) public returns (uint32) {
        return manager.cancel(caller, target, data);
    }

    function hashOperation(address caller, address target, bytes calldata data) public returns (bytes32) {
        return manager.hashOperation(caller, target, data);
    }

    function updateAuthority(address target, address newAuthority) public {
        manager.updateAuthority(target, newAuthority);
    }
}