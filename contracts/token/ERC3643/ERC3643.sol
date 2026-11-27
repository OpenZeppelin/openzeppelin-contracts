// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {IERC3643, IERC3643IdentityRegistry, IERC3643Compliance, IERC3643Identity} from "../../interfaces/IERC3643.sol";
import {Math} from "../../utils/math/Math.sol";
import {Pausable} from "../../utils/Pausable.sol";
import {ERC20} from "../ERC20/ERC20.sol";

/**
 * @dev Base implementation of https://eips.ethereum.org/EIPS/eip-3643[ERC-3643], a permissioned
 * security token standard.
 *
 * Extends {ERC20} and {Pausable} with the compliance-and-identity checks required to
 * transfer regulated securities. The token relies on two collaborators:
 *
 * * an {IERC3643IdentityRegistry} that verifies whether an address may hold the token, through its
 *   own claims + trusted-issuers-and-topics setup;
 * * an {IERC3643Compliance} that applies per-token rules to every movement and is notified of every
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
 *   compliance ({IERC3643Compliance-bindToken}) is left to the derived contract.
 * * {_recoveryAddress}: the whole recovery flow is exposed as an internal virtual so a
 *   derived contract can supply preconditions or additional identity-migration steps
 *   before calling `super._recoveryAddress`. The identity check lives in {recoveryAddress},
 *   so a derived contract with a different recovery policy overrides that function instead.
 *
 * Deliberate deviations from ERC-3643 (`erc-3643.md` and the interfaces in its assets), each of
 * which a derived contract may reverse by overriding the function in parentheses:
 *
 * * Mint checks {IERC3643Compliance-canTransfer} in addition to the recipient's identity, as the
 *   reference implementation does, so supply caps and distribution rules also apply to
 *   issuance. The ERC text has mint bypass the compliance rules ({_update}).
 * * {setCompliance} and the constructor do not call {IERC3643Compliance-bindToken}; the assets have
 *   `setCompliance` bind the token ({_setCompliance}).
 * * {freezePartialTokens} freezes at most the free balance instead of the specified amount,
 *   and {IERC3643-TokensFrozen} reports the amount actually frozen ({_freezePartialTokens}).
 * * A failed recovery reverts instead of emitting the `RecoveryFails` event the assets
 *   mention, which no ERC-3643 interface declares ({_recoveryAddress}).
 * * During a recovery, {IERC3643-AddressFrozen} records the token as the actor rather than
 *   the calling agent ({_recoveryAddress}).
 * * {batchBurn} does not require the wallets to be verified, unlike the assets. The ERC text
 *   has burn bypass all eligibility checks, and {burn} does not require it either ({_update}).
 * * Neither the ERC-173 owner nor the {IERC3643AgentRole} functions are defined (see below).
 *
 * The token also behaves as follows:
 *
 * * {recoveryAddress} requires `investorOnchainID` to be the identity the lost wallet is
 *   registered with.
 * * Mint and burn work while the token is paused; only transfers block. Circulation and
 *   issuance/redemption are separate operational concerns.
 * * {forcedTransfer} and {recoveryAddress} bypass the pause too, in line with the spec
 *   phrasing that a forced transfer "only requires the receiver to be whitelisted and
 *   verified." A derived contract that treats pause as an incident halt and wants to
 *   contain the forced-transfer agent during it may override {_forcedTransfer} with
 *   {Pausable-whenNotPaused}, which covers {forcedTransfer}, {batchForcedTransfer} and
 *   {recoveryAddress}.
 * * {IERC3643Compliance-created} fires on mint and {IERC3643Compliance-destroyed} on burn, in addition
 *   to {IERC3643Compliance-transferred} on transfers, so modules that track distribution stay
 *   in sync with supply changes.
 * * Burn skips the recipient identity check (the recipient is the zero address).
 * * {_unfreezePartialTokens} reverts with a Solidity panic on under-freeze; a derived
 *   contract may override to use a named error.
 * * A burn auto-unfreezes just enough of `from`'s frozen balance to cover itself, so the
 *   `frozenTokens <= balanceOf` invariant is preserved across every path.
 *
 * NOTE: Every transfer, mint and burn ends with an external call to the compliance
 * ({IERC3643Compliance-transferred}, {IERC3643Compliance-created} or {IERC3643Compliance-destroyed}), made after
 * the balances are updated, and the compliance may reenter the token from it. A deployment
 * that binds compliance code it does not control can inherit {ReentrancyGuardTransient} and
 * mark {_update}, {forcedTransfer}, {batchForcedTransfer} and {_recoveryAddress} with
 * `nonReentrant`. {_forcedTransfer} stays unguarded because {_recoveryAddress} calls it,
 * and a nested guard would make every recovery revert.
 *
 * [WARNING]
 * ====
 * This contract should not be combined with any other ERC-20 extension. It assumes it
 * is the only extension that customizes balance movements: forced transfers and recoveries
 * skip the {_update} chain, and the compliance is notified from inside {_update}. Extensions
 * that keep balance-derived accounting in {_update}, such as {ERC20Votes}, would miss these
 * movements. The compliance is notified of every movement (including mints, burns, forced
 * transfers and recoveries), so such state belongs in a compliance module.
 *
 * The following extensions are known to cause bugs when combined with this contract. This list
 * is not exhaustive, and other extensions may cause issues too:
 *
 * * {ERC20Votes}
 * * {ERC4626} and {ERC7540}
 * * {ERC20FlashMint}
 * * {ERC20Crosschain} and {ERC20Bridgeable}
 * ====
 *
 * IMPORTANT: ERC-3643 requires an ERC-173 owner and an agent role compatible with {IERC3643AgentRole}.
 * The owner sets the name, symbol, onchain ID, identity registry and compliance; agents run the
 * other administrative functions. This contract defines neither role, so a derived contract adds
 * both and enforces them in {_checkAdmin}. The token must also be an agent of its identity
 * registry, since {recoveryAddress} registers and deletes identities there.
 *
 * @custom:namespace-override erc3643.storage.ERC3643Token
 */
abstract contract ERC3643 is ERC20, Pausable, IERC3643 {
    mapping(address account => bool) private _frozen;
    mapping(address account => uint256) private _frozenTokens;

    IERC3643IdentityRegistry private _identityRegistry;
    IERC3643Compliance private _compliance;

    address private _onchainID;

    /// @dev The identity registry is the zero address.
    error ERC3643MissingIdentityRegistry();

    /// @dev The compliance is the zero address.
    error ERC3643MissingCompliance();

    /// @dev The transfer amount is greater than the unfrozen balance.
    error ERC3643InsufficientUnfrozenBalance(address from, uint256 value, uint256 unfrozen);

    /// @dev The wallet is frozen.
    error ERC3643FrozenWallet(address account);

    /// @dev A call to {IERC3643IdentityRegistry-isVerified} returned false during a transfer.
    error ERC3643UnverifiedRecipient(address account);

    /// @dev A call to {IERC3643Compliance-canTransfer} returned false during a transfer.
    error ERC3643ComplianceViolation(address from, address to, uint256 value);

    /// @dev The investor identity of a recovery is not the identity `lost` is registered with.
    error ERC3643InvalidRecoveryIdentity(address lost, address investorOnchainID);

    /// @dev The new wallet of a recovery is the lost wallet.
    error ERC3643InvalidRecoveryWallet(address wallet);

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
    function identityRegistry() public view virtual returns (IERC3643IdentityRegistry) {
        return _identityRegistry;
    }

    /// @inheritdoc IERC3643
    function compliance() public view virtual returns (IERC3643Compliance) {
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

    /**
     * @dev See {IERC3643-setCompliance}. Only records the address and emits {IERC3643-ComplianceAdded}.
     * Binding the token to the new compliance ({IERC3643Compliance-bindToken}) is left to the derived contract.
     */
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

    /**
     * @dev See {IERC3643-recoveryAddress}. Requires `updated` to be a different wallet than `lost`,
     * and `investorOnchainID` to be the identity `lost` is registered with, so a recovery only moves
     * an investor's position between their own wallets.
     *
     * A derived contract with a different recovery policy (e.g. accepting an unregistered `lost`
     * when `updated` already belongs to `investorOnchainID`, or checking keys on the identity)
     * can override this function and call {_recoveryAddress} after its own checks.
     */
    function recoveryAddress(
        address lost,
        address updated,
        address investorOnchainID
    ) public virtual onlyAdmin returns (bool) {
        require(lost != updated, ERC3643InvalidRecoveryWallet(updated));
        require(
            address(identityRegistry().identity(lost)) == investorOnchainID,
            ERC3643InvalidRecoveryIdentity(lost, investorOnchainID)
        );
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
    function _setAddressFrozen(address account, bool frozen) internal {
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
        _identityRegistry = IERC3643IdentityRegistry(identityRegistry_);
        emit IdentityRegistryAdded(identityRegistry_);
    }

    /**
     * @dev Writes the compliance pointer, optionally emitting {ComplianceAdded}. The
     * `emitEvent` flag lets a derived contract bind the new compliance before emitting,
     * so the event only reports a binding that succeeded.
     */
    function _setCompliance(address compliance_, bool emitEvent) internal virtual {
        _compliance = IERC3643Compliance(compliance_);
        if (emitEvent) emit ComplianceAdded(compliance_);
    }

    /**
     * @dev Moves `value` from `from` to `to` bypassing pause and freeze checks, auto-unfreezing
     * just enough of `from`'s frozen balance to cover the amount. Recipient identity is
     * still verified. Reverts with {ERC3643UnverifiedRecipient} when the recipient is not verified.
     *
     * The pause bypass follows the spec phrasing that a forced transfer "only requires the
     * receiver to be whitelisted and verified." A derived contract that treats pause as an
     * incident halt should override this function with {Pausable-whenNotPaused}, which
     * covers {forcedTransfer}, {batchForcedTransfer} and {recoveryAddress}, so the halt
     * contains the forced-transfer agent too.
     *
     * Balances move through {ERC20-_update} directly, so neither the checks in {_update} nor
     * any other `_update` override in the inheritance chain (e.g. {ERC20Votes}) run on this
     * path. The compliance is still notified through {IERC3643Compliance-transferred}, so state
     * derived from balances stays in sync when it lives in a compliance module.
     */
    function _forcedTransfer(address from, address to, uint256 value) internal virtual returns (bool) {
        if (from == address(0)) revert ERC20InvalidSender(address(0));
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        require(identityRegistry().isVerified(to), ERC3643UnverifiedRecipient(to));
        _autoUnfreezeFor(from, value);
        ERC20._update(from, to, value); // bypasses the checks in _update
        compliance().transferred(from, to, value);
        return true;
    }

    /**
     * @dev Recovers `lost`'s balance and frozen state onto `updated`, points the identity
     * registry at `investorOnchainID`, and clears the old identity binding. Does not check
     * that `investorOnchainID` belongs to `lost`; {recoveryAddress} does.
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
     * The frozen amount and frozen status move from `lost` to `updated` before the balance,
     * so the compliance notification inside {_forcedTransfer} already sees the recovered
     * tokens frozen on `updated`.
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
        IERC3643IdentityRegistry idRegistry = identityRegistry();
        uint256 investorTokens = balanceOf(lost);
        uint256 frozenTokens = getFrozenTokens(lost);
        bool lostFrozen = isFrozen(lost);

        idRegistry.registerIdentity(updated, IERC3643Identity(investorOnchainID), idRegistry.investorCountry(lost));

        if (frozenTokens > 0) {
            _unfreezePartialTokens(lost, frozenTokens);
            _frozenTokens[updated] += frozenTokens;
            emit TokensFrozen(updated, frozenTokens);
        }
        if (lostFrozen) {
            _setAddressFrozen(lost, false, address(this));
            if (!isFrozen(updated)) {
                _setAddressFrozen(updated, true, address(this));
            }
        }

        _forcedTransfer(lost, updated, investorTokens);

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
        IERC3643Compliance compliance_ = compliance();

        if (!isMint && !isBurn) {
            _requireNotPaused();
            require(!isFrozen(to), ERC3643FrozenWallet(to));
            require(!isFrozen(from), ERC3643FrozenWallet(from));
            uint256 balance = balanceOf(from);
            uint256 unfrozen;
            unchecked {
                unfrozen = balance - getFrozenTokens(from);
            }
            // Only check the frozen portion here. A plain `value > balance` is left to `super._update` balance check.
            require(value <= unfrozen || balance < value, ERC3643InsufficientUnfrozenBalance(from, value, unfrozen));
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
