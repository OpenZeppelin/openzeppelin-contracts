// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// solhint-disable func-name-mixedcase

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC7540} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540.sol";
import {ERC7540AdminMock} from "@openzeppelin/contracts/mocks/token/ERC7540AdminMock.sol";
import {ERC7540DelayMock} from "@openzeppelin/contracts/mocks/token/ERC7540DelayMock.sol";
import {ERC7540EpochMock} from "@openzeppelin/contracts/mocks/token/ERC7540EpochMock.sol";

contract ERC7540InvariantAsset is ERC20 {
    constructor() ERC20("ERC7540InvariantAsset", "AST") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ERC7540InvariantAdminVault is ERC7540AdminMock {
    constructor(IERC20 asset_, address holder) ERC20("Vault", "VLT") ERC7540(asset_) ERC7540AdminMock(holder) {}

    function fulfillDeposit(uint256 assets, uint256 shares, address controller) external {
        _fulfillDeposit(assets, shares, controller);
    }

    function fulfillRedeem(uint256 shares, uint256 assets, address controller) external {
        _fulfillRedeem(shares, assets, controller);
    }
}

contract ERC7540InvariantDelayVault is ERC7540DelayMock {
    constructor(IERC20 asset_) ERC20("Vault", "VLT") ERC7540(asset_) {}
}

contract ERC7540InvariantEpochVault is ERC7540EpochMock {
    constructor(IERC20 asset_, address holder) ERC20("Vault", "VLT") ERC7540(asset_) ERC7540EpochMock(holder) {}

    function fulfillDepositEpoch(uint256 epochId, uint256 shares) external {
        _fulfillDeposit(epochId, shares);
    }

    function fulfillRedeemEpoch(uint256 epochId, uint256 assets) external {
        _fulfillRedeem(epochId, assets);
    }

    function totalClaimableDepositAssets() external view returns (uint256) {
        return _totalClaimableDepositAssets();
    }

    function totalClaimableRedeemAssets() external view returns (uint256) {
        return _totalClaimableRedeemAssets();
    }
}

interface IERC7540InvariantVault {
    function requestDeposit(uint256 assets, address controller, address owner) external returns (uint256);
    function deposit(uint256 assets, address receiver, address controller) external returns (uint256);
    function mint(uint256 shares, address receiver, address controller) external returns (uint256);
    function requestRedeem(uint256 shares, address controller, address owner) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address controller) external returns (uint256);
    function redeem(uint256 shares, address receiver, address controller) external returns (uint256);
    function maxDeposit(address) external view returns (uint256);
    function maxMint(address) external view returns (uint256);
    function maxWithdraw(address) external view returns (uint256);
    function maxRedeem(address) external view returns (uint256);
    function pendingDepositRequest(uint256, address) external view returns (uint256);
    function pendingRedeemRequest(uint256, address) external view returns (uint256);
    function totalPendingDepositAssets() external view returns (uint256);
    function totalPendingRedeemShares() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function fulfillDeposit(uint256 assets, uint256 shares, address controller) external;
    function fulfillRedeem(uint256 shares, uint256 assets, address controller) external;
    // Epoch strategy
    function setOperator(address operator, bool approved) external returns (bool);
    function claimableDepositRequest(uint256, address) external view returns (uint256);
    function claimableRedeemRequest(uint256, address) external view returns (uint256);
    function currentDepositEpoch() external view returns (uint256);
    function currentRedeemEpoch() external view returns (uint256);
    function totalDepositAssets(uint256 epochId) external view returns (uint256);
    function totalDepositShares(uint256 epochId) external view returns (uint256);
    function totalRedeemShares(uint256 epochId) external view returns (uint256);
    function totalRedeemAssets(uint256 epochId) external view returns (uint256);
    function depositEpochs(address controller, uint256 start, uint256 end) external view returns (uint256[] memory);
    function redeemEpochs(address controller, uint256 start, uint256 end) external view returns (uint256[] memory);
    function fulfillDepositEpoch(uint256 epochId, uint256 shares) external;
    function fulfillRedeemEpoch(uint256 epochId, uint256 assets) external;
    function totalClaimableDepositAssets() external view returns (uint256);
    function totalClaimableRedeemAssets() external view returns (uint256);
}

// solhint-disable-next-line max-states-count
contract ERC7540InvariantHandler is Test {
    IERC7540InvariantVault public immutable vault;
    ERC7540InvariantAsset public immutable asset;
    bool public immutable isAdmin;
    bool public immutable isEpoch;
    address public immutable holder;

    uint256 internal constant EPOCH_QUEUE_LIMIT = 32;

    address[] public actors;

    // ghost accounting
    uint256 public depRequested;
    uint256 public depClaimedAssets;
    uint256 public depFulfilledAssets;
    uint256 public depFulfilledShares;
    uint256 public depClaimedShares;
    uint256 public redRequested;
    uint256 public redFulfilledShares;
    uint256 public redFulfilledAssets;
    uint256 public redClaimedShares;
    uint256 public redClaimedAssets;
    uint256 public assetsOut;
    uint256 public donated;

    string public failure; // first unexpected revert

    mapping(address => uint256) public depPerController; // Delay: requested - claimed (assets)
    mapping(address => uint256) public redPerController; // Delay: requested - claimed (shares)

    // Epoch: epochs that received requests, in order, and whether they were fulfilled
    uint256[] public depEpochs;
    uint256[] public redEpochs;
    mapping(uint256 => bool) public depEpochFulfilled;
    mapping(uint256 => bool) public redEpochFulfilled;

    constructor(
        IERC7540InvariantVault vault_,
        ERC7540InvariantAsset asset_,
        bool isAdmin_,
        bool isEpoch_,
        address holder_
    ) {
        vault = vault_;
        asset = asset_;
        isAdmin = isAdmin_;
        isEpoch = isEpoch_;
        holder = holder_;
        actors.push(address(0xA11CE));
        actors.push(address(0xB0B));
        actors.push(address(0xCA401));

        // Epoch requests must come from the controller or its operator
        if (isEpoch_) {
            for (uint256 i = 0; i < actors.length; ++i) {
                for (uint256 j = 0; j < actors.length; ++j) {
                    if (i == j) continue;
                    vm.prank(actors[i]);
                    vault_.setOperator(actors[j], true);
                }
            }
        }
    }

    function depEpochsLength() external view returns (uint256) {
        return depEpochs.length;
    }

    function redEpochsLength() external view returns (uint256) {
        return redEpochs.length;
    }

    function actorsLength() external view returns (uint256) {
        return actors.length;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function _fail(string memory what) internal {
        if (bytes(failure).length == 0) failure = what;
    }

    function requestDeposit(uint256 a, uint256 c, uint256 amount) external {
        address owner = _actor(a);
        address controller = _actor(c);
        amount = bound(amount, 1, 1e30);
        if (
            isEpoch &&
            _epochQueueFull(vault.depositEpochs(controller, 0, type(uint256).max), vault.currentDepositEpoch())
        ) return;
        asset.mint(owner, amount);
        vm.startPrank(owner);
        asset.approve(address(vault), amount);
        try vault.requestDeposit(amount, controller, owner) {
            depRequested += amount;
            depPerController[controller] += amount;
            if (isEpoch) _recordEpoch(depEpochs, vault.currentDepositEpoch());
        } catch {
            _fail("requestDeposit reverted");
        }
        vm.stopPrank();
    }

    function fulfillDeposit(uint256 c, uint256 amount, uint256 rateBps) external {
        if (!isAdmin) return;
        address controller = _actor(c);
        uint256 pending = vault.pendingDepositRequest(0, controller);
        if (pending == 0) return;
        amount = bound(amount, 1, pending);
        uint256 shares = (amount * bound(rateBps, 1, 30_000)) / 10_000;
        try vault.fulfillDeposit(amount, shares, controller) {
            depFulfilledAssets += amount;
            depFulfilledShares += shares;
        } catch {
            _fail("fulfillDeposit reverted");
        }
    }

    function claimDeposit(uint256 c, uint256 amount) external {
        address controller = _actor(c);
        uint256 max = vault.maxDeposit(controller);
        uint256 maxShares = vault.maxMint(controller);
        if (max == 0) return;
        amount = bound(amount, 1, max);
        vm.prank(controller);
        try vault.deposit(amount, controller, controller) returns (uint256 shares) {
            // shares received must not exceed the claimable rate, unless the whole claim is drained
            if (!isEpoch && amount != max && shares * max > amount * maxShares)
                _fail("deposit claim rounded in favor of user");
            depClaimedAssets += amount;
            depClaimedShares += shares;
            depPerController[controller] -= amount;
        } catch {
            _fail("deposit claim within maxDeposit reverted");
        }
    }

    function claimMint(uint256 c, uint256 shares) external {
        address controller = _actor(c);
        uint256 max = vault.maxMint(controller);
        uint256 maxAssets = vault.maxDeposit(controller);
        if (max == 0) return;
        shares = bound(shares, 1, max);
        vm.prank(controller);
        try vault.mint(shares, controller, controller) returns (uint256 assets) {
            // assets consumed must not fall below the claimable rate, unless the whole claim is drained
            if (!isEpoch && shares != max && assets * max < shares * maxAssets)
                _fail("mint claim rounded in favor of user");
            depClaimedAssets += assets;
            depClaimedShares += shares;
            depPerController[controller] -= assets;
        } catch {
            _fail("mint claim within maxMint reverted");
        }
    }

    function requestRedeem(uint256 a, uint256 c, uint256 shares) external {
        address owner = _actor(a);
        address controller = _actor(c);
        uint256 bal = vault.balanceOf(owner);
        if (bal == 0) return;
        shares = bound(shares, 1, bal);
        if (
            isEpoch && _epochQueueFull(vault.redeemEpochs(controller, 0, type(uint256).max), vault.currentRedeemEpoch())
        ) return;
        vm.prank(owner);
        try vault.requestRedeem(shares, controller, owner) {
            redRequested += shares;
            redPerController[controller] += shares;
            if (isEpoch) _recordEpoch(redEpochs, vault.currentRedeemEpoch());
        } catch {
            _fail("requestRedeem reverted");
        }
    }

    function fulfillRedeem(uint256 c, uint256 shares, uint256 rateBps) external {
        if (!isAdmin) return;
        address controller = _actor(c);
        uint256 pending = vault.pendingRedeemRequest(0, controller);
        if (pending == 0) return;
        shares = bound(shares, 1, pending);
        // keep the vault solvent: never promise more than the free balance
        uint256 free = asset.balanceOf(address(vault)) - vault.totalPendingDepositAssets() - _owedRedeemAssets();
        uint256 assets = (shares * bound(rateBps, 1, 30_000)) / 10_000;
        if (assets > free) assets = free;
        try vault.fulfillRedeem(shares, assets, controller) {
            redFulfilledShares += shares;
            redFulfilledAssets += assets;
        } catch {
            _fail("fulfillRedeem reverted");
        }
    }

    function claimWithdraw(uint256 c, uint256 assets) external {
        address controller = _actor(c);
        uint256 max = vault.maxWithdraw(controller);
        uint256 maxShares = vault.maxRedeem(controller);
        if (max == 0) return;
        assets = bound(assets, 1, max);
        vm.prank(controller);
        try vault.withdraw(assets, controller, controller) returns (uint256 shares) {
            // shares consumed must not fall below the claimable rate, unless the whole claim is drained
            if (!isEpoch && assets != max && shares * max < assets * maxShares)
                _fail("withdraw claim rounded in favor of user");
            redClaimedAssets += assets;
            redClaimedShares += shares;
            assetsOut += assets;
            redPerController[controller] -= shares;
        } catch {
            _fail("withdraw claim within maxWithdraw reverted");
        }
    }

    function claimRedeem(uint256 c, uint256 shares) external {
        address controller = _actor(c);
        uint256 max = vault.maxRedeem(controller);
        uint256 maxAssets = vault.maxWithdraw(controller);
        if (max == 0) return;
        shares = bound(shares, 1, max);
        vm.prank(controller);
        try vault.redeem(shares, controller, controller) returns (uint256 assets) {
            // assets received must not exceed the claimable rate, unless the whole claim is drained
            if (!isEpoch && shares != max && assets * max > shares * maxAssets)
                _fail("redeem claim rounded in favor of user");
            redClaimedAssets += assets;
            redClaimedShares += shares;
            assetsOut += assets;
            redPerController[controller] -= shares;
        } catch {
            _fail("redeem claim within maxRedeem reverted");
        }
    }

    /// @dev A zero-amount claim must drain shares left claimable after partial claims consumed all claimable assets.
    function claimDepositDust(uint256 c) external {
        address controller = _actor(c);
        uint256 dust = vault.maxMint(controller);
        if (vault.maxDeposit(controller) != 0 || dust == 0) return;
        vm.prank(controller);
        try vault.deposit(0, controller, controller) returns (uint256 shares) {
            if (shares != dust || vault.maxMint(controller) != 0) _fail("deposit dust not drained");
            depClaimedShares += shares;
        } catch {
            _fail("deposit dust claim reverted");
        }
    }

    /// @dev A zero-share claim must drain assets left claimable after partial claims consumed all claimable shares.
    function claimRedeemDust(uint256 c) external {
        address controller = _actor(c);
        uint256 dust = vault.maxWithdraw(controller);
        if (vault.maxRedeem(controller) != 0 || dust == 0) return;
        vm.prank(controller);
        try vault.redeem(0, controller, controller) returns (uint256 assets) {
            if (assets != dust || vault.maxWithdraw(controller) != 0) _fail("redeem dust not drained");
            redClaimedAssets += assets;
            assetsOut += assets;
        } catch {
            _fail("redeem dust claim reverted");
        }
    }

    /// @dev Epoch: fulfills a past, unfulfilled deposit epoch (picked at random, so possibly out of order).
    function fulfillDepositEpoch(uint256 seed, uint256 rateBps) external {
        if (!isEpoch) return;
        (bool found, uint256 epochId) = _pickEpoch(depEpochs, depEpochFulfilled, vault.currentDepositEpoch(), seed);
        if (!found) return;
        uint256 assets = vault.totalDepositAssets(epochId);
        uint256 shares = (assets * bound(rateBps, 1, 30_000)) / 10_000;
        try vault.fulfillDepositEpoch(epochId, shares) {
            if (shares == 0) return; // no-op, the epoch stays Pending
            depEpochFulfilled[epochId] = true;
            depFulfilledAssets += assets;
            depFulfilledShares += shares;
        } catch {
            _fail("fulfillDepositEpoch reverted");
        }
    }

    /// @dev Epoch: fulfills a past, unfulfilled redeem epoch (picked at random, so possibly out of order).
    function fulfillRedeemEpoch(uint256 seed, uint256 rateBps) external {
        if (!isEpoch) return;
        (bool found, uint256 epochId) = _pickEpoch(redEpochs, redEpochFulfilled, vault.currentRedeemEpoch(), seed);
        if (!found) return;
        uint256 shares = vault.totalRedeemShares(epochId);
        // keep the vault solvent: never promise more than the free balance (see {ERC7540-_isSolvent})
        uint256 free = asset.balanceOf(address(vault)) +
            vault.totalClaimableDepositAssets() -
            vault.totalPendingDepositAssets() -
            vault.totalClaimableRedeemAssets();
        uint256 assets = (shares * bound(rateBps, 1, 30_000)) / 10_000;
        if (assets > free) assets = free;
        try vault.fulfillRedeemEpoch(epochId, assets) {
            if (assets == 0) return; // no-op, the epoch stays Pending
            redEpochFulfilled[epochId] = true;
            redFulfilledShares += shares;
            redFulfilledAssets += assets;
        } catch {
            _fail("fulfillRedeemEpoch reverted");
        }
    }

    function donate(uint256 amount) external {
        amount = bound(amount, 1, 1e24);
        asset.mint(address(vault), amount);
        donated += amount;
    }

    function warp(uint256 dt) external {
        vm.warp(block.timestamp + bound(dt, 1, isEpoch ? 8 days : 3 hours));
    }

    function _owedRedeemAssets() internal view returns (uint256 sum) {
        for (uint256 i = 0; i < actors.length; ++i) sum += vault.maxWithdraw(actors[i]);
    }

    /// @dev A request would revert if it opens a new epoch in a controller's queue that is already at the limit.
    function _epochQueueFull(uint256[] memory queue, uint256 current) internal pure returns (bool) {
        return queue.length >= EPOCH_QUEUE_LIMIT && queue[queue.length - 1] != current;
    }

    function _recordEpoch(uint256[] storage epochs, uint256 epochId) internal {
        if (epochs.length == 0 || epochs[epochs.length - 1] != epochId) epochs.push(epochId);
    }

    function _pickEpoch(
        uint256[] storage epochs,
        mapping(uint256 => bool) storage fulfilled,
        uint256 current,
        uint256 seed
    ) internal view returns (bool, uint256) {
        for (uint256 i = 0; i < epochs.length; ++i) {
            uint256 epochId = epochs[((seed % epochs.length) + i) % epochs.length];
            if (epochId < current && !fulfilled[epochId]) return (true, epochId);
        }
        return (false, 0);
    }
}

abstract contract ERC7540InvariantBase is Test {
    ERC7540InvariantAsset internal asset;
    IERC7540InvariantVault internal vault;
    ERC7540InvariantHandler internal handler;

    function _setUp(IERC7540InvariantVault vault_, bool isAdmin, bool isEpoch, address holder) internal {
        vault = vault_;
        handler = new ERC7540InvariantHandler(vault_, asset, isAdmin, isEpoch, holder);
        targetContract(address(handler));
    }

    function _sumActors(function(address) external view returns (uint256) f) internal view returns (uint256 sum) {
        for (uint256 i = 0; i < handler.actorsLength(); ++i) sum += f(handler.actors(i));
    }

    function invariant_noUnexpectedRevert() public view {
        assertEq(handler.failure(), "");
    }

    function invariant_solvency() public view {
        // reverts if the balance plus claimable deposit assets no longer covers pending deposits and claimable redeems
        vault.totalAssets();
    }

    function invariant_assetConservation() public view {
        assertEq(asset.balanceOf(address(vault)), handler.depRequested() + handler.donated() - handler.assetsOut());
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 200
/// forge-config: default.invariant.fail_on_revert = true
contract ERC7540AdminMintOnClaimInvariant is ERC7540InvariantBase {
    function setUp() public {
        asset = new ERC7540InvariantAsset();
        _setUp(
            IERC7540InvariantVault(address(new ERC7540InvariantAdminVault(asset, address(0)))),
            true,
            false,
            address(0)
        );
    }

    function invariant_depositAccounting() public view {
        // mint-on-claim: pending total covers both pending and claimable (unclaimed) assets
        assertEq(vault.totalPendingDepositAssets(), handler.depRequested() - handler.depClaimedAssets());
        assertEq(_sumActors(vault.maxDeposit), handler.depFulfilledAssets() - handler.depClaimedAssets());
        assertEq(_sumActors(vault.maxMint), handler.depFulfilledShares() - handler.depClaimedShares());
    }

    function invariant_redeemAccounting() public view {
        // burn-at-request: pending total covers both pending and claimable (unclaimed) shares
        assertEq(vault.totalPendingRedeemShares(), handler.redRequested() - handler.redClaimedShares());
        assertEq(_sumActors(vault.maxRedeem), handler.redFulfilledShares() - handler.redClaimedShares());
        assertEq(_sumActors(vault.maxWithdraw), handler.redFulfilledAssets() - handler.redClaimedAssets());
    }

    function invariant_supply() public view {
        assertEq(vault.totalSupply(), _sumActors(vault.balanceOf));
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 200
/// forge-config: default.invariant.fail_on_revert = true
contract ERC7540AdminEscrowInvariant is ERC7540InvariantBase {
    address internal constant HOLDER = address(0xC0FFEE);

    function setUp() public {
        asset = new ERC7540InvariantAsset();
        _setUp(IERC7540InvariantVault(address(new ERC7540InvariantAdminVault(asset, HOLDER))), true, false, HOLDER);
    }

    function invariant_depositAccounting() public view {
        // pre-mint: fulfilled assets leave the pending total at fulfillment
        assertEq(vault.totalPendingDepositAssets(), handler.depRequested() - handler.depFulfilledAssets());
        assertEq(_sumActors(vault.maxDeposit), handler.depFulfilledAssets() - handler.depClaimedAssets());
        assertEq(_sumActors(vault.maxMint), handler.depFulfilledShares() - handler.depClaimedShares());
    }

    function invariant_redeemAccounting() public view {
        // escrow: pending shares sit in the holder, claimable shares are burned and tracked
        assertEq(vault.totalPendingRedeemShares(), handler.redFulfilledShares() - handler.redClaimedShares());
        assertEq(_sumActors(vault.maxRedeem), handler.redFulfilledShares() - handler.redClaimedShares());
        assertEq(_sumActors(vault.maxWithdraw), handler.redFulfilledAssets() - handler.redClaimedAssets());
    }

    function invariant_holderCustody() public view {
        assertEq(
            vault.balanceOf(HOLDER),
            (handler.depFulfilledShares() - handler.depClaimedShares()) +
                (handler.redRequested() - handler.redFulfilledShares())
        );
    }

    function invariant_supply() public view {
        assertEq(vault.totalSupply(), _sumActors(vault.balanceOf) + vault.balanceOf(HOLDER));
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 200
/// forge-config: default.invariant.fail_on_revert = true
contract ERC7540DelayInvariant is ERC7540InvariantBase {
    function setUp() public {
        asset = new ERC7540InvariantAsset();
        _setUp(IERC7540InvariantVault(address(new ERC7540InvariantDelayVault(asset))), false, false, address(0));
    }

    function invariant_depositAccounting() public view {
        assertEq(vault.totalPendingDepositAssets(), handler.depRequested() - handler.depClaimedAssets());
        for (uint256 i = 0; i < handler.actorsLength(); ++i) {
            address a = handler.actors(i);
            assertLe(vault.maxDeposit(a), handler.depPerController(a));
        }
    }

    function invariant_redeemAccounting() public view {
        assertEq(vault.totalPendingRedeemShares(), handler.redRequested() - handler.redClaimedShares());
        for (uint256 i = 0; i < handler.actorsLength(); ++i) {
            address a = handler.actors(i);
            assertLe(vault.maxRedeem(a), handler.redPerController(a));
        }
    }

    function invariant_supply() public view {
        assertEq(vault.totalSupply(), _sumActors(vault.balanceOf));
    }
}

abstract contract ERC7540EpochInvariantBase is ERC7540InvariantBase {
    function invariant_epochTotals() public view {
        // Each epoch's totals are the sum of its requests, and a fulfilled epoch never regresses to the Pending
        // sentinel while requests remain.
        for (uint256 i = 0; i < handler.depEpochsLength(); ++i) {
            uint256 epochId = handler.depEpochs(i);
            uint256 sum = 0;
            for (uint256 j = 0; j < handler.actorsLength(); ++j) {
                address a = handler.actors(j);
                sum += vault.pendingDepositRequest(epochId, a) + vault.claimableDepositRequest(epochId, a);
            }
            assertEq(sum, vault.totalDepositAssets(epochId));
            if (handler.depEpochFulfilled(epochId)) {
                assertTrue(vault.totalDepositShares(epochId) > 0 || vault.totalDepositAssets(epochId) == 0);
            } else {
                assertEq(vault.totalDepositShares(epochId), 0);
            }
        }
        for (uint256 i = 0; i < handler.redEpochsLength(); ++i) {
            uint256 epochId = handler.redEpochs(i);
            uint256 sum = 0;
            for (uint256 j = 0; j < handler.actorsLength(); ++j) {
                address a = handler.actors(j);
                sum += vault.pendingRedeemRequest(epochId, a) + vault.claimableRedeemRequest(epochId, a);
            }
            assertEq(sum, vault.totalRedeemShares(epochId));
            if (handler.redEpochFulfilled(epochId)) {
                assertTrue(vault.totalRedeemAssets(epochId) > 0 || vault.totalRedeemShares(epochId) == 0);
            } else {
                assertEq(vault.totalRedeemAssets(epochId), 0);
            }
        }
    }

    function invariant_queueLimit() public view {
        for (uint256 i = 0; i < handler.actorsLength(); ++i) {
            address a = handler.actors(i);
            assertLe(vault.depositEpochs(a, 0, type(uint256).max).length, 32);
            assertLe(vault.redeemEpochs(a, 0, type(uint256).max).length, 32);
        }
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 200
/// forge-config: default.invariant.fail_on_revert = true
contract ERC7540EpochMintOnClaimInvariant is ERC7540EpochInvariantBase {
    function setUp() public {
        asset = new ERC7540InvariantAsset();
        _setUp(
            IERC7540InvariantVault(address(new ERC7540InvariantEpochVault(asset, address(0)))),
            false,
            true,
            address(0)
        );
    }

    function invariant_depositAccounting() public view {
        // mint-on-claim: pending total covers both pending and claimable (unclaimed) assets
        assertEq(vault.totalPendingDepositAssets(), handler.depRequested() - handler.depClaimedAssets());
        assertEq(vault.totalClaimableDepositAssets(), handler.depFulfilledAssets() - handler.depClaimedAssets());
    }

    function invariant_redeemAccounting() public view {
        // burn-at-request: pending total covers both pending and claimable (unclaimed) shares
        assertEq(vault.totalPendingRedeemShares(), handler.redRequested() - handler.redClaimedShares());
        // residue released by partial claims lowers the claimable assets below the ghost value
        assertLe(vault.totalClaimableRedeemAssets(), handler.redFulfilledAssets() - handler.redClaimedAssets());
    }

    function invariant_supply() public view {
        assertEq(vault.totalSupply(), _sumActors(vault.balanceOf));
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 200
/// forge-config: default.invariant.fail_on_revert = true
contract ERC7540EpochEscrowInvariant is ERC7540EpochInvariantBase {
    address internal constant HOLDER = address(0xC0FFEE);

    function setUp() public {
        asset = new ERC7540InvariantAsset();
        _setUp(IERC7540InvariantVault(address(new ERC7540InvariantEpochVault(asset, HOLDER))), false, true, HOLDER);
    }

    function invariant_depositAccounting() public view {
        // pre-mint: fulfilled assets leave the pending total at fulfillment
        assertEq(vault.totalPendingDepositAssets(), handler.depRequested() - handler.depFulfilledAssets());
        assertEq(vault.totalClaimableDepositAssets(), 0);
    }

    function invariant_redeemAccounting() public view {
        // escrow: pending shares sit in the holder, claimable shares are burned and tracked
        assertEq(vault.totalPendingRedeemShares(), handler.redFulfilledShares() - handler.redClaimedShares());
        // residue released by partial claims lowers the claimable assets below the ghost value
        assertLe(vault.totalClaimableRedeemAssets(), handler.redFulfilledAssets() - handler.redClaimedAssets());
    }

    function invariant_holderCustody() public view {
        // residue burned by partial claims lowers the holder balance below the ghost value
        assertLe(
            vault.balanceOf(HOLDER),
            (handler.depFulfilledShares() - handler.depClaimedShares()) +
                (handler.redRequested() - handler.redFulfilledShares())
        );
    }

    function invariant_supply() public view {
        assertEq(vault.totalSupply(), _sumActors(vault.balanceOf) + vault.balanceOf(HOLDER));
    }
}
