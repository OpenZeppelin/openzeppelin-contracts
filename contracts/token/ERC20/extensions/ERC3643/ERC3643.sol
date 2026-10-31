// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {IERC3643, IIdentityRegistry, ICompliance, IIdentity} from "../../../../interfaces/IERC3643.sol";
import {Math} from "../../../../utils/math/Math.sol";
import {Pausable} from "../../../../utils/Pausable.sol";
import {ERC20} from "../../ERC20.sol";

/**
 * @dev Base implementation of https://eips.ethereum.org/EIPS/eip-3643[ERC-3643], a permissioned
 * security token standard.
 *
 * Extends {ERC20} and {Pausable} with the compliance-and-identity checks required to
 * transfer regulated securities. The token relies on two collaborators:
 *
 * * an {IIdentityRegistry} that verifies whether an address may hold the token, through its
 *   own claims + trusted-issuers-and-topics setup;
 * * an {ICompliance} that applies per-token rules to every movement and is notified of every
 *   supply change so its modules can track distribution.
 *
 * Extension points:
 *
 * * {_checkAdmin}: authorization hook. Downstream contracts wire it to their chosen
 *   access-control mechanism ({Ownable}, {AccessManager}, per-selector roles, ...).
 * * {_setIdentityRegistry} and {_setCompliance}: internal setters, overridable so a
 *   derived contract can add validation or a handshake before the write. `_setCompliance`
 *   takes an `emitEvent` flag so a derived contract can bind the new compliance and only
 *   emit {IERC3643-ComplianceAdded} once the bind has succeeded. Binding the token to its
 *   compliance ({ICompliance-bindToken}) is left to the derived contract.
 * * {_recoveryAddress}: the whole recovery flow is exposed as an internal virtual so a
 *   derived contract can supply preconditions or additional identity-migration steps
 *   before calling `super._recoveryAddress`.
 *
 * Deliberate divergences from the ERC-3643 text, each of which a derived contract may
 * reverse by overriding the relevant hook:
 *
 * * Mint checks {ICompliance-canTransfer} in addition to the recipient's identity, as the
 *   reference implementation does, so supply caps and distribution rules also apply to
 *   issuance. The ERC text has mint bypass the compliance rules.
 * * Mint and burn work while the token is paused; only transfers block. Circulation and
 *   issuance/redemption are separate operational concerns.
 * * {forcedTransfer} and {recoveryAddress} bypass the pause too, in line with the spec
 *   phrasing that a forced transfer "only requires the receiver to be whitelisted and
 *   verified." A derived contract that treats pause as an incident halt and wants to
 *   contain the forced-transfer agent during it may override both entry points with
 *   {Pausable-whenNotPaused}.
 * * {ICompliance-created} fires on mint and {ICompliance-destroyed} on burn, in addition
 *   to {ICompliance-transferred} on transfers, so modules that track distribution stay
 *   in sync with supply changes.
 * * Burn skips the recipient identity check (the recipient is the zero address).
 * * {_freezePartialTokens} silently clamps to the free balance instead of reverting.
 * * {_unfreezePartialTokens} reverts with a Solidity panic on under-freeze; a derived
 *   contract may override to use a named error.
 * * A burn auto-unfreezes just enough of `from`'s frozen balance to cover itself, so the
 *   `frozenTokens <= balanceOf` invariant is preserved across every path.
 *
 * NOTE: Every transfer, mint and burn ends with an external call to the compliance
 * ({ICompliance-transferred}, {ICompliance-created} or {ICompliance-destroyed}), made after
 * the balances are updated, and the compliance may reenter the token from it. A deployment
 * that binds compliance code it does not control can inherit {ReentrancyGuardTransient} and
 * mark {_update}, {_forcedTransfer} and {_recoveryAddress} with `nonReentrant`.
 */
abstract contract ERC3643 is ERC20, Pausable, IERC3643 {
    mapping(address account => bool) private _frozen;
    mapping(address account => uint256) private _frozenTokens;

    IIdentityRegistry private _identityRegistry;
    ICompliance private _compliance;

    address private _onchainID;

    /// @dev The identity registry is the zero address.
    error ERC3643MissingIdentityRegistry();

    /// @dev The compliance is the zero address.
    error ERC3643MissingCompliance();

    /// @dev The transfer amount is greater than the unfrozen balance.
    error ERC3643InsufficientUnfrozenBalance(address from, uint256 value, uint256 unfrozen);

    /// @dev The wallet is frozen.
    error ERC3643FrozenWallet(address account);

    /// @dev A call to {IIdentityRegistry-isVerified} returned false during a transfer.
    error ERC3643UnverifiedRecipient(address account);

    /// @dev A call to {ICompliance-canTransfer} returned false during a transfer.
    error ERC3643ComplianceViolation(address from, address to, uint256 value);

    /// @dev A call to {_forcedTransfer} returned false during a recovery.
    error ERC3643FailedForcedTransfer(address from, address to, uint256 value);

    /// @dev A batch entry point received arrays of different lengths.
    error ERC3643InvalidArrayLength();

    /**
     * @dev Reverts unless {_checkAdmin} accepts the caller.
     */
    modifier onlyAdmin() {
        _checkAdmin();
        _;
    }

    constructor(address identityRegistry_, address compliance_, address onchainID_) {
        require(identityRegistry_ != address(0), ERC3643MissingIdentityRegistry());
        require(compliance_ != address(0), ERC3643MissingCompliance());
        _setIdentityRegistry(identityRegistry_);
        _setCompliance(compliance_, true);
        _onchainID = onchainID_; // zero address allowed for no onchainID
        _emitUpdatedTokenInformation();
    }

    /// @inheritdoc IERC3643
    function onchainID() public view virtual returns (address) {
        return _onchainID;
    }

    /**
     * @dev See {IERC3643-version}. Returns "1" by default; override to report the token's own versioning.
     */
    function version() public view virtual returns (string memory) {
        return "1";
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
    function setName(string memory name_) public virtual onlyAdmin {
        _setName(name_);
    }

    /// @inheritdoc IERC3643
    function setSymbol(string memory symbol_) public virtual onlyAdmin {
        _setSymbol(symbol_);
    }

    /// @inheritdoc IERC3643
    function setOnchainID(address onchainID_) public virtual onlyAdmin {
        _setOnchainID(onchainID_);
    }

    /// @inheritdoc IERC3643
    function pause() public virtual onlyAdmin {
        _pause();
    }

    /// @inheritdoc IERC3643
    function unpause() public virtual onlyAdmin {
        _unpause();
    }

    /// @inheritdoc IERC3643
    function setAddressFrozen(address account, bool frozen) public virtual onlyAdmin {
        _setAddressFrozen(account, frozen);
    }

    /// @inheritdoc IERC3643
    function freezePartialTokens(address account, uint256 value) public virtual onlyAdmin {
        _freezePartialTokens(account, value);
    }

    /// @inheritdoc IERC3643
    function unfreezePartialTokens(address account, uint256 value) public virtual onlyAdmin {
        _unfreezePartialTokens(account, value);
    }

    /// @inheritdoc IERC3643
    function setIdentityRegistry(address identityRegistry_) public virtual onlyAdmin {
        require(identityRegistry_ != address(0), ERC3643MissingIdentityRegistry());
        _setIdentityRegistry(identityRegistry_);
    }

    /// @inheritdoc IERC3643
    function setCompliance(address compliance_) public virtual onlyAdmin {
        require(compliance_ != address(0), ERC3643MissingCompliance());
        _setCompliance(compliance_, true);
    }

    /// @inheritdoc IERC3643
    function forcedTransfer(address from, address to, uint256 value) public virtual onlyAdmin returns (bool) {
        return _forcedTransfer(from, to, value);
    }

    /// @inheritdoc IERC3643
    function mint(address to, uint256 value) public virtual onlyAdmin {
        _mint(to, value);
    }

    /// @inheritdoc IERC3643
    function burn(address from, uint256 value) public virtual onlyAdmin {
        _burn(from, value);
    }

    /// @inheritdoc IERC3643
    function recoveryAddress(
        address lost,
        address updated,
        address investorOnchainID
    ) public virtual onlyAdmin returns (bool) {
        return _recoveryAddress(lost, updated, investorOnchainID);
    }

    /// @inheritdoc IERC3643
    function batchTransfer(address[] calldata toList, uint256[] calldata values) public virtual {
        require(toList.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < toList.length; ++i) {
            transfer(toList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchForcedTransfer(
        address[] calldata fromList,
        address[] calldata toList,
        uint256[] calldata values
    ) public virtual onlyAdmin {
        require(fromList.length == toList.length && fromList.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < fromList.length; ++i) {
            _forcedTransfer(fromList[i], toList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchMint(address[] calldata toList, uint256[] calldata values) public virtual onlyAdmin {
        require(toList.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < toList.length; ++i) {
            _mint(toList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchBurn(address[] calldata fromList, uint256[] calldata values) public virtual onlyAdmin {
        require(fromList.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < fromList.length; ++i) {
            _burn(fromList[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchSetAddressFrozen(address[] calldata accounts, bool[] calldata frozen) public virtual onlyAdmin {
        require(accounts.length == frozen.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < accounts.length; ++i) {
            _setAddressFrozen(accounts[i], frozen[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchFreezePartialTokens(address[] calldata accounts, uint256[] calldata values) public virtual onlyAdmin {
        require(accounts.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < accounts.length; ++i) {
            _freezePartialTokens(accounts[i], values[i]);
        }
    }

    /// @inheritdoc IERC3643
    function batchUnfreezePartialTokens(
        address[] calldata accounts,
        uint256[] calldata values
    ) public virtual onlyAdmin {
        require(accounts.length == values.length, ERC3643InvalidArrayLength());
        for (uint256 i; i < accounts.length; ++i) {
            _unfreezePartialTokens(accounts[i], values[i]);
        }
    }

    /**
     * @dev Authorization hook. Must revert if `_msgSender()` may not call the current entry
     * point. The selector being authorized is `bytes4(msg.data)`; batch functions reach
     * this hook with their own batch selector, so a derived contract that maps batch
     * calls to their single-item counterpart must translate here.
     */
    function _checkAdmin() internal virtual;

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

    /// @dev Internal version of {IERC3643-setOnchainID}.
    function _setOnchainID(address onchainID_) internal virtual {
        _onchainID = onchainID_;
        _emitUpdatedTokenInformation();
    }

    /// @dev Overload that records `_msgSender()` as the actor on the {AddressFrozen} event.
    function _setAddressFrozen(address account, bool frozen) internal virtual {
        _setAddressFrozen(account, frozen, _msgSender());
    }

    /// @dev Records `actor` on the {AddressFrozen} event. Callable from paths that want to
    /// attribute the action to something other than the message sender.
    function _setAddressFrozen(address account, bool frozen, address actor) internal virtual {
        _frozen[account] = frozen;
        emit AddressFrozen(account, frozen, actor);
    }

    /**
     * @dev Freezes up to `value` tokens on `account`, silently clamped to the free
     * balance (`balanceOf(account) - getFrozenTokens(account)`). A derived contract may
     * override to reject over-freeze with a named error.
     */
    function _freezePartialTokens(address account, uint256 value) internal virtual {
        uint256 frozen = getFrozenTokens(account);
        uint256 toFreeze;
        unchecked {
            // frozen is an invariant <= balanceOf, so the subtraction cannot underflow.
            toFreeze = Math.min(value, balanceOf(account) - frozen);
            _frozenTokens[account] = frozen + toFreeze; // <= balanceOf, so cannot overflow
        }
        emit TokensFrozen(account, toFreeze);
    }

    /**
     * @dev Releases `value` from `account`'s frozen balance. Reverts with a Solidity
     * panic on under-freeze; a derived contract may override to revert with a named error.
     */
    function _unfreezePartialTokens(address account, uint256 value) internal virtual {
        _frozenTokens[account] -= value;
        emit TokensUnfrozen(account, value);
    }

    /// @dev Internal version of {IERC3643-setIdentityRegistry}.
    function _setIdentityRegistry(address identityRegistry_) internal virtual {
        _identityRegistry = IIdentityRegistry(identityRegistry_);
        emit IdentityRegistryAdded(identityRegistry_);
    }

    /**
     * @dev Writes the compliance pointer, optionally emitting {ComplianceAdded}. The
     * `emitEvent` flag lets a derived contract bind the new compliance before emitting,
     * so the event only reports a binding that succeeded.
     */
    function _setCompliance(address compliance_, bool emitEvent) internal virtual {
        _compliance = ICompliance(compliance_);
        if (emitEvent) emit ComplianceAdded(compliance_);
    }

    /**
     * @dev Moves `value` from `from` to `to` bypassing pause and freeze checks, auto-unfreezing
     * just enough of `from`'s frozen balance to cover the amount. Recipient identity is
     * still verified. Returns false when the recipient is not verified.
     *
     * The pause bypass follows the spec phrasing that a forced transfer "only requires the
     * receiver to be whitelisted and verified." A derived contract that treats pause as an
     * incident halt should override {forcedTransfer} (and {recoveryAddress}, which reaches
     * this path) with {Pausable-whenNotPaused} so the halt contains the forced-transfer
     * agent too.
     */
    function _forcedTransfer(address from, address to, uint256 value) internal virtual returns (bool) {
        if (from == address(0)) revert ERC20InvalidSender(address(0));
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        if (identityRegistry().isVerified(to)) {
            _autoUnfreezeFor(from, value);
            ERC20._update(from, to, value); // bypasses the checks in _update
            compliance().transferred(from, to, value);
            return true;
        }
        return false;
    }

    /**
     * @dev Recovers `lost`'s balance and frozen state onto `updated`, points the identity
     * registry at `investorOnchainID`, and clears the old identity binding.
     *
     * Left as a hook: derived contracts may add preconditions (e.g. verify a MANAGEMENT
     * key on the ONCHAINID, forbid same-wallet recovery), guard the migration semantics
     * they care about (e.g. avoid overwriting a wallet already resolved through a global
     * fallback), or notify compliance with pre-migration identity values, before calling
     * `super._recoveryAddress`.
     *
     * Ordering matters: the new identity is registered *before* the balance moves so
     * `compliance.transferred` (invoked inside `forcedTransfer`) sees both endpoints
     * resolvable: `lost` still resolves to the old identity, `updated` to the new one.
     * The old registration is deleted only after all migration steps.
     *
     * The whole balance of `lost` moves through {_forcedTransfer}, which auto-unfreezes all
     * of `lost`'s frozen tokens, so the frozen amount ends up entirely on `updated`. An
     * override that moves less than the full balance must clear the residual frozen amount
     * on `lost` itself.
     *
     * A zero `lost` or `updated` reverts in {_forcedTransfer} ({ERC20InvalidSender} /
     * {ERC20InvalidReceiver}), so overrides that keep the balance migration on that path
     * keep the zero-address guard.
     *
     * Can reenter through the identity registry, which is trusted.
     */
    // slither-disable-next-line reentrancy-no-eth
    function _recoveryAddress(
        address lost,
        address updated,
        address investorOnchainID
    ) internal virtual returns (bool) {
        IIdentityRegistry idRegistry = identityRegistry();
        uint256 investorTokens = balanceOf(lost);
        uint256 frozenTokens = getFrozenTokens(lost);
        bool lostFrozen = isFrozen(lost);

        idRegistry.registerIdentity(updated, IIdentity(investorOnchainID), idRegistry.investorCountry(lost));

        require(
            _forcedTransfer(lost, updated, investorTokens),
            ERC3643FailedForcedTransfer(lost, updated, investorTokens)
        );

        if (frozenTokens > 0) {
            _frozenTokens[updated] += frozenTokens;
            emit TokensFrozen(updated, frozenTokens);
        }
        if (lostFrozen) {
            _setAddressFrozen(lost, false, address(this));
            if (!isFrozen(updated)) {
                _setAddressFrozen(updated, true, address(this));
            }
        }

        idRegistry.deleteIdentity(lost);
        emit RecoverySuccess(lost, updated, investorOnchainID);
        return true;
    }

    /**
     * @dev ERC-20 state transition plus the ERC-3643 rules:
     *
     * * transfers block while paused, on frozen wallets, and above the free balance;
     * * mints and burns skip the pause and freeze checks (pause governs circulation, not issuance);
     * * mints and transfers check the recipient identity and the compliance predicate;
     * * burns skip both (the recipient is the zero address);
     * * burns auto-unfreeze just enough of `from`'s frozen balance to preserve `frozenTokens <= balanceOf`;
     * * compliance is notified via `created` on mint, `destroyed` on burn, and
     *   `transferred` on transfer so modules that track supply stay in sync.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        bool isMint = from == address(0);
        bool isBurn = to == address(0);
        ICompliance compliance_ = compliance();

        if (!isMint && !isBurn) {
            _requireNotPaused();
            require(!isFrozen(to), ERC3643FrozenWallet(to));
            require(!isFrozen(from), ERC3643FrozenWallet(from));
            uint256 unfrozen;
            unchecked {
                unfrozen = balanceOf(from) - getFrozenTokens(from);
            }
            require(unfrozen >= value, ERC3643InsufficientUnfrozenBalance(from, value, unfrozen));
        } else if (isBurn) {
            _autoUnfreezeFor(from, value);
        }

        if (!isBurn) {
            require(identityRegistry().isVerified(to), ERC3643UnverifiedRecipient(to));
            require(compliance_.canTransfer(from, to, value), ERC3643ComplianceViolation(from, to, value));
        }

        super._update(from, to, value);

        if (isMint) compliance_.created(to, value);
        else if (isBurn) compliance_.destroyed(from, value);
        else compliance_.transferred(from, to, value);
    }

    /**
     * @dev Releases just enough of `from`'s frozen balance to let `value` move. Skipped
     * when `value > balanceOf(from)`, letting {ERC20-_update} revert with the standard
     * insufficient-balance error.
     */
    function _autoUnfreezeFor(address from, uint256 value) internal virtual {
        uint256 balance = balanceOf(from);
        if (value > balance) return;
        uint256 frozenAmount = getFrozenTokens(from);
        unchecked {
            uint256 unfrozen = balance - frozenAmount; // invariant: frozenAmount <= balance
            if (value > unfrozen) {
                uint256 toUnfreeze = value - unfrozen; // value > unfrozen
                _frozenTokens[from] = frozenAmount - toUnfreeze; // toUnfreeze <= frozenAmount
                emit TokensUnfrozen(from, toUnfreeze);
            }
        }
    }

    function _emitUpdatedTokenInformation() internal virtual {
        emit UpdatedTokenInformation(name(), symbol(), decimals(), version(), onchainID());
    }
}
