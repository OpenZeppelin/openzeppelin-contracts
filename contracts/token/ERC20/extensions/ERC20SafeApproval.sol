// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";

/**
 * @dev Extension of ERC20 that adds a configurable approval cap
 * and per-approval expiration timestamps.
 */
abstract contract ERC20SafeApproval is ERC20 {

    /**
     * @dev The approval amount exceeds the configured cap
     */
    error ERC20ApprovalCapExceeded(uint256 attempted, uint256 cap);

    /**
     * @dev A transferFrom was attempted with an expired approval
     */
    error ERC20ApprovalExpired(address owner, address spender, uint256 expiryTime);

    /**
     * @dev An approval was attempted with an expiration time in the past
     */
    error ERC20InvalidExpiration(uint256 expiryTime);

    // TODO: approval cap storage
    uint256 private _approvalCap;
    // TODO: expiry storage
    
    // TODO: override transferFrom()
    mapping(address owner => mapping(address spender => uint256 expiry)) private _approvalExpiry;

    event ApprovalCapUpdated(uint256 oldCap, uint256 newCap);
    event ApprovalWithExpiration(address indexed owner, address indexed spender, uint256 value, uint256 expiryTime);

    constructor(uint256 cap) {
        _setApprovalCap(cap);
    }

    function getApprovalCap() public view virtual returns (uint256) {
        return _approvalCap;
    }

    function getApprovalExpiry(address owner, address spender) public view virtual returns (uint256) {
        return _approvalExpiry[owner][spender];
    }

    function isApprovalExpired(address owner, address spender) public view virtual returns (bool) {
        uint256 expiry = _approvalExpiry[owner][spender];
        return expiry != 0 && block.timestamp > expiry;
    }

    // TODO: override approve()
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _checkCap(amount);
        delete _approvalExpiry[msg.sender][spender];
        return super.approve(spender, amount);
    }

    function approveWithExpiration(address spender, uint256 amount, uint256 expiryTime) public virtual returns (bool) {
        if (expiryTime <= block.timestamp) {
            revert ERC20InvalidExpiration(expiryTime);
        }
        _checkCap(amount);
        _approvalExpiry[msg.sender][spender] = expiryTime;
        emit ApprovalWithExpiration(msg.sender, spender, amount, expiryTime);
        return super.approve(spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        uint256 expiry = _approvalExpiry[from][msg.sender];
        if (expiry != 0 && block.timestamp > expiry) {
            revert ERC20ApprovalExpired(from, msg.sender, expiry);
        }
        return super.transferFrom(from, to, amount);
    }

    function _checkCap(uint256 value) internal view virtual {
        uint256 cap = _approvalCap;
        if (cap != type(uint256).max && value > cap) {
            revert ERC20ApprovalCapExceeded(value, cap);
        }
    }

    function _setApprovalCap(uint256 newCap) internal virtual {
        uint256 oldCap = _approvalCap;
        _approvalCap = newCap;
        emit ApprovalCapUpdated(oldCap, newCap);
    }
    
}