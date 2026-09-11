// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Context} from "../../../../utils/Context.sol";
import {Pausable} from "../../../../utils/Pausable.sol";
import {IERC3643, IIdentityRegistry, ICompliance, IIdentity} from "../../../../interfaces/IERC3643.sol";
import {ERC20} from "../../ERC20.sol";
import {Math} from "../../../../utils/math/Math.sol";
import {Ownable} from "../../../../access/Ownable.sol";

abstract contract ERC3643 is Context, ERC20, Ownable, Pausable, IERC3643 {
    mapping(address => bool) private _frozen;
    mapping(address => uint256) private _frozenTokens;

    IIdentityRegistry private _identityRegistry;
    ICompliance private _compliance;

    address private _onchainID;

    /// @dev The identity registry is the zero address
    error ERC3643MissingIdentityRegistry();

    /// @dev The compliance is the zero address
    error ERC3643MissingCompliance();

    /// @dev The transfer amount is greater than the unfrozen balance
    error ERC3643InsufficientUnfrozenBalance(address from, uint256 value, uint256 unfrozen);

    /// @dev The wallet is frozen
    error ERC3643FrozenWallet(address account);

    /// @dev A call to {IIdentityRegistry-isVerified} returned false during a transfer
    error ERC3643UnverifiedRecipient(address account);

    /// @dev A call to {ICompliance-canTransfer} returned false during a transfer
    error ERC3643ComplianceViolation(address from, address to, uint256 value);

    /// @dev A call to {IERC3643-forcedTransfer} returned false during a transfer
    error ERC3643FailedForcedTransfer(address from, address to, uint256 value);

    modifier onlyAgentOrOwner() {
        _checkAgentOrOwner(_msgSender());
        _;
    }

    constructor(IIdentityRegistry identityRegistry_, ICompliance compliance_, address onchainID_) {
        require(address(identityRegistry_) != address(0), ERC3643MissingIdentityRegistry());
        require(address(compliance_) != address(0), ERC3643MissingCompliance());
        _setIdentityRegistry(identityRegistry_);
        _setCompliance(compliance_);
        _onchainID = onchainID_; // zero address allowed for no onchainID
        _emitUpdatedTokenInformation();
    }

    function isAgent(address account) public view virtual returns (bool);

    /// @inheritdoc IERC3643
    function onchainID() public view virtual returns (address) {
        return _onchainID;
    }

    /// @inheritdoc IERC3643
    function version() public pure virtual returns (string memory) {
        return "5.5.0"; // TODO: Can we validate the version against package.json?
    }

    /// @inheritdoc IERC3643
    function identityRegistry() public view virtual returns (IIdentityRegistry) {
        return _identityRegistry;
    }

    /// @inheritdoc IERC3643
    function compliance() public view virtual returns (ICompliance) {
        return _compliance;
    }

    /// @inheritdoc IERC3643
    function isFrozen(address account) public view virtual returns (bool) {
        return _frozen[account];
    }

    /// @inheritdoc IERC3643
    function getFrozenTokens(address account) public view virtual returns (uint256) {
        return _frozenTokens[account];
    }

    /// @inheritdoc IERC3643
    function setName(string memory name_) public virtual onlyOwner {
        _setName(name_);
    }

    /// @inheritdoc IERC3643
    function setSymbol(string memory symbol_) public virtual onlyOwner {
        _setSymbol(symbol_);
    }

    /// @inheritdoc IERC3643
    function setOnchainID(address onchainID_) public virtual onlyOwner {
        _setOnchainID(onchainID_);
    }

    /// @inheritdoc IERC3643
    function pause() public virtual onlyAgentOrOwner {
        _pause();
    }

    /// @inheritdoc IERC3643
    function unpause() public virtual onlyAgentOrOwner {
        _unpause();
    }

    // /// @inheritdoc IERC3643
    function setAddressFrozen(address account, bool frozen) public virtual onlyAgentOrOwner {
        _setAddressFrozen(account, frozen, _msgSender());
    }

    /// @inheritdoc IERC3643
    function freezePartialTokens(address account, uint256 value) public virtual onlyAgentOrOwner {
        _freezePartialTokens(account, value);
    }

    /// @inheritdoc IERC3643
    function unfreezePartialTokens(address account, uint256 value) public virtual onlyAgentOrOwner {
        _unfreezePartialTokens(account, value);
    }

    /// @inheritdoc IERC3643
    function setIdentityRegistry(IIdentityRegistry identityRegistry_) public virtual onlyOwner {
        _setIdentityRegistry(identityRegistry_);
    }

    /// @inheritdoc IERC3643
    function setCompliance(ICompliance compliance_) public virtual onlyOwner {
        _setCompliance(compliance_);
    }

    /// @inheritdoc IERC3643
    function forcedTransfer(address from, address to, uint256 value) public virtual onlyAgentOrOwner returns (bool) {
        return _forcedTransfer(from, to, value);
    }

    /// @inheritdoc IERC3643
    function mint(address to, uint256 value) public virtual onlyAgentOrOwner {
        _mint(to, value);
    }

    /// @inheritdoc IERC3643
    function burn(address from, uint256 value) public virtual onlyAgentOrOwner {
        _burn(from, value);
    }

    /// @inheritdoc IERC3643
    function recoveryAddress(
        address lost,
        address updated,
        address investorOnchainID
    ) public virtual onlyAgentOrOwner returns (bool) {
        return _recoveryAddress(lost, updated, investorOnchainID);
    }

    /// @inheritdoc IERC3643
    function batchTransfer(address[] calldata toList, uint256[] calldata values) public virtual {
        for (uint256 i; i < toList.length; ++i) {
            transfer(toList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchForcedTransfer(
        address[] calldata fromList,
        address[] calldata toList,
        uint256[] calldata values
    ) public virtual {
        for (uint256 i; i < fromList.length; ++i) {
            forcedTransfer(fromList[i], toList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchMint(address[] calldata toList, uint256[] calldata values) public virtual {
        for (uint256 i; i < toList.length; ++i) {
            mint(toList[i], values[i]);
        }
    }
    /// @inheritdoc IERC3643
    function batchBurn(address[] calldata fromList, uint256[] calldata values) public virtual {
        for (uint256 i; i < fromList.length; ++i) {
            burn(fromList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchSetAddressFrozen(address[] calldata accounts, bool[] calldata frozen) public virtual {
        for (uint256 i; i < accounts.length; ++i) {
            setAddressFrozen(accounts[i], frozen[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchFreezePartialTokens(address[] calldata accounts, uint256[] calldata values) public virtual {
        for (uint256 i; i < accounts.length; ++i) {
            freezePartialTokens(accounts[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchUnfreezePartialTokens(address[] calldata accounts, uint256[] calldata values) public virtual {
        for (uint256 i; i < accounts.length; ++i) {
            unfreezePartialTokens(accounts[i], values[i]);
        }
    }

    /// @inheritdoc ERC20
    function _setName(string memory name_) internal virtual override {
        super._setName(name_);
        _emitUpdatedTokenInformation();
    }

    /// @inheritdoc ERC20
    function _setSymbol(string memory symbol_) internal virtual override {
        super._setSymbol(symbol_);
        _emitUpdatedTokenInformation();
    }

    /**
     * @dev Internal version of {IERC3643-setOnchainID}.
     */
    function _setOnchainID(address onchainID_) internal virtual {
        _onchainID = onchainID_;
        _emitUpdatedTokenInformation();
    }

    function _setAddressFrozen(address account, bool frozen, address owner_) internal virtual {
        _frozen[account] = frozen;
        emit AddressFrozen(account, frozen, owner_);
    }

    function _freezePartialTokens(address account, uint256 value) internal virtual {
        // TODO: Unchecked block?
        uint256 toFreeze = Math.min(value, balanceOf(account) - getFrozenTokens(account));
        _frozenTokens[account] += toFreeze;
        emit TokensFrozen(account, toFreeze);
    }

    function _unfreezePartialTokens(address account, uint256 value) internal virtual {
        // TODO: Unchecked block?
        _frozenTokens[account] -= value;
        emit TokensUnfrozen(account, value);
    }

    function _setIdentityRegistry(IIdentityRegistry identityRegistry_) internal virtual {
        _identityRegistry = identityRegistry_;
        emit IdentityRegistryAdded(identityRegistry_);
    }

    function _setCompliance(ICompliance compliance_) internal virtual {
        _compliance = compliance_;
        emit ComplianceAdded(compliance_);
    }

    function _forcedTransfer(address from, address to, uint256 value) internal virtual returns (bool) {
        if (identityRegistry().isVerified(to)) {
            // TODO: Unchecked block?
            uint256 freeBalance = balanceOf(from) - getFrozenTokens(from);
            if (value > freeBalance) {
                _unfreezePartialTokens(from, value - freeBalance);
            }

            ERC20._update(from, to, value); // Bypasses the freezing mechanism
            compliance().transferred(from, to, value); // Checks the compliance
            return true;
        }
        return false;
    }

    // Can reenter, but it's not a risk since the identity registry is considered a trusted contract
    // slither-disable-next-line reentrancy-no-eth
    function _recoveryAddress(
        address lost,
        address updated,
        address investorOnchainID
    ) internal virtual returns (bool) {
        IIdentity oid = IIdentity(investorOnchainID);
        // TODO: keyHasPurpose is not defined in IERC734. Wat do?
        if (oid.keyHasPurpose(keccak256(abi.encode(updated)), IIdentity.KeyPurpose.Execution)) {
            uint256 investorTokens = balanceOf(lost);
            uint256 frozenTokens = getFrozenTokens(lost);
            IIdentityRegistry idRegistry = identityRegistry();
            idRegistry.registerIdentity(updated, oid, idRegistry.investorCountry(lost));
            require(
                forcedTransfer(lost, updated, investorTokens),
                ERC3643FailedForcedTransfer(lost, updated, investorTokens)
            );
            if (frozenTokens > 0) {
                freezePartialTokens(updated, frozenTokens);
            } // TODO: Unfreeze partial tokens from lost?
            if (isFrozen(lost)) {
                setAddressFrozen(updated, true);
            } // TODO: Unfreeze lost?
            idRegistry.deleteIdentity(lost);
            emit RecoverySuccess(lost, updated, investorOnchainID);
            return true;
        }
        return false;
    }

    function _update(address from, address to, uint256 value) internal virtual override whenNotPaused {
        uint256 unfrozen = balanceOf(from) - getFrozenTokens(from);
        require(unfrozen >= value, ERC3643InsufficientUnfrozenBalance(from, value, unfrozen));
        require(!isFrozen(to), ERC3643FrozenWallet(to));
        require(!isFrozen(from), ERC3643FrozenWallet(from));
        super._update(from, to, value);
        require(identityRegistry().isVerified(to), ERC3643UnverifiedRecipient(to));
        ICompliance compliance_ = compliance();
        require(compliance_.canTransfer(from, to, value), ERC3643ComplianceViolation(from, to, value));
        compliance_.transferred(from, to, value);
    }

    function _checkAgentOrOwner(address account) internal virtual {
        require(isAgent(account) || owner() == account, OwnableUnauthorizedAccount(account));
    }

    function _emitUpdatedTokenInformation() internal virtual {
        emit UpdatedTokenInformation(name(), symbol(), decimals(), version(), onchainID());
    }
}
