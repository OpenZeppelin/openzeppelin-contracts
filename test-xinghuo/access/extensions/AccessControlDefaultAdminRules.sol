pragma solidity ^0.8.20;

import {AccessControlDefaultAdminRules} from "../../../openzeppelin-contracts/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {IAccessControlDefaultAdminRules} from "../../../openzeppelin-contracts/contracts/access/extensions/IAccessControlDefaultAdminRules.sol";

contract MyAccessControlDefaultAdminRules is AccessControlDefaultAdminRules {
    constructor(uint48 initialDelay, address initialDefaultAdmin) AccessControlDefaultAdminRules(initialDelay, initialDefaultAdmin) {

    }
    
    function supportsInterface() public returns(bool) {
        return AccessControlDefaultAdminRules.supportsInterface(type(IAccessControlDefaultAdminRules).interfaceId);
    }

    //owner 与 defaultAdmin相同 owner是为了实现IERC5313标准
    function Owner() public returns(address) {
        return owner();
    }

    function DefaultAdmin() public returns(address) {
        return defaultAdmin();
    }

    function GrantRole(bytes32 role, address account) public {
        grantRole(role, account);
    }

    function RevokeRole(bytes32 role, address account) public {
        revokeRole(role, account);
    }

    function RenounceRole(bytes32 role, address account) public {
        renounceRole(role, account);
    }

    function PendingDefaultAdmin() public returns(address,uint48) {
        return pendingDefaultAdmin();
    }
    
    function DefaultAdminDelay() public returns(uint48) {
        return defaultAdminDelay();
    }

    function PendingDefaultAdminDelay() public returns(uint48, uint48) {
        return pendingDefaultAdminDelay();
    }

    function DefaultAdminDelayIncreaseWait() public returns(uint48) {
        return defaultAdminDelayIncreaseWait();
    }

    function BeginDefaultAdminTransfer(address newAdmin) public {
        beginDefaultAdminTransfer(newAdmin);
    }

    function CancelDefaultAdminTransfer() public {
        cancelDefaultAdminTransfer();
    }

    function AcceptDefaultAdminTransfer() public {
        acceptDefaultAdminTransfer();
    }

    function ChangeDefaultAdminDelay(uint48 newDelay) public {
        changeDefaultAdminDelay(newDelay);
    }

    function RollbackDefaultAdminDelay() public {
        rollbackDefaultAdminDelay();
    }
}