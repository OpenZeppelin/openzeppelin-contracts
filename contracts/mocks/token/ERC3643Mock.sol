// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Ownable} from "../../access/Ownable.sol";
import {IERC20} from "../../interfaces/IERC20.sol";
import {IIdentity} from "../../interfaces/IERC3643.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC3643} from "../../token/ERC20/extensions/ERC3643/ERC3643.sol";

contract ERC3643Mock is ERC3643, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        address identityRegistry_,
        address compliance_,
        address onchainID_,
        address owner_
    ) ERC20(name_, symbol_) ERC3643(identityRegistry_, compliance_, onchainID_) Ownable(owner_) {}

    // Agents are not modeled: only the owner passes the admin check.
    function _checkAdmin() internal view override {
        _checkOwner();
    }
}

/// @dev Identity registry where a wallet is verified when the identity it is registered with is verified.
contract ERC3643IdentityRegistryMock {
    mapping(address user => IIdentity) private _identities;
    mapping(address user => uint16) private _countries;
    mapping(IIdentity identity => bool) private _verified;

    event IdentityRegistered(address indexed investorAddress, IIdentity indexed identity);
    event IdentityRemoved(address indexed investorAddress, IIdentity indexed identity);

    function setIdentity(address user, IIdentity identity_) public {
        _identities[user] = identity_;
    }

    function setVerified(IIdentity identity_, bool verified) public {
        _verified[identity_] = verified;
    }

    function registerIdentity(address user, IIdentity identity_, uint16 country) public {
        _identities[user] = identity_;
        _countries[user] = country;
        emit IdentityRegistered(user, identity_);
    }

    function deleteIdentity(address user) public {
        IIdentity identity_ = _identities[user];
        delete _identities[user];
        delete _countries[user];
        emit IdentityRemoved(user, identity_);
    }

    function identity(address user) public view returns (IIdentity) {
        return _identities[user];
    }

    function investorCountry(address user) public view returns (uint16) {
        return _countries[user];
    }

    function isVerified(address user) public view returns (bool) {
        IIdentity identity_ = _identities[user];
        return address(identity_) != address(0) && _verified[identity_];
    }
}

/// @dev Compliance whose answer to `canTransfer` is set by the test, and that records every notification.
contract ERC3643ComplianceMock {
    bool private _canTransfer = true;

    event Transferred(address from, address to, uint256 amount);
    event Created(address to, uint256 amount);
    event Destroyed(address from, uint256 amount);

    function setCanTransfer(bool canTransfer_) public {
        _canTransfer = canTransfer_;
    }

    function canTransfer(address, address, uint256) public view returns (bool) {
        return _canTransfer;
    }

    function transferred(address from, address to, uint256 amount) public virtual {
        emit Transferred(from, to, amount);
    }

    function created(address to, uint256 amount) public {
        emit Created(to, amount);
    }

    function destroyed(address from, uint256 amount) public {
        emit Destroyed(from, amount);
    }
}

/// @dev Compliance that, once armed, spends `to`'s tokens from its `transferred` notification.
contract ERC3643ReentrantComplianceMock is ERC3643ComplianceMock {
    address private _receiver;
    uint256 private _amount;

    function setReentry(address receiver, uint256 amount) public {
        _receiver = receiver;
        _amount = amount;
    }

    function transferred(address from, address to, uint256 amount) public override {
        super.transferred(from, to, amount);
        uint256 reentryAmount = _amount;
        if (reentryAmount > 0) {
            _amount = 0; // reenter once
            IERC20(msg.sender).transferFrom(to, _receiver, reentryAmount);
        }
    }
}
