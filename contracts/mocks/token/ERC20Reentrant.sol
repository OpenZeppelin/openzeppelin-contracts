// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../token/ERC20/ERC20.sol";
import "../../utils/Address.sol";

contract ERC20Reentrant is ERC20("TEST", "TST") {
    enum Type {
        No,
        Before,
        After
    }

    Type private _reenterType;
    address private _reenterTarget;
    bytes private _reenterData;

    function scheduleReenter(Type when, address target, bytes calldata data) external {
        _reenterType = when;
        _reenterTarget = target;
        _reenterData = data;
    }

    function functionCall(address target, bytes memory data) public returns (bytes memory) {
        return Address.functionCall(target, data);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (_reenterType == Type.Before) {
            _reenterType = Type.No;
            functionCall(_reenterTarget, _reenterData);
        }
        super._update(from, to, amount);
        if (_reenterType == Type.After) {
            _reenterType = Type.No;
            functionCall(_reenterTarget, _reenterData);
        }
    }
}
