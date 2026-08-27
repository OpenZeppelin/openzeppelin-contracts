import "helpers/helpers.spec";
import "helpers/math-cvl.spec";
import "helpers/erc20-cvl.spec";

methods {
    // ---- shares token (the vault itself) ----
    function totalSupply()                external returns (uint256) envfree;
    function balanceOf(address)           external returns (uint256) envfree;
    function allowance(address,address)   external returns (uint256) envfree;

    // ---- vault views ----
    function asset()                      external returns (address) envfree;
    function totalAssets()                external returns (uint256) envfree;
    function convertToShares(uint256)     external returns (uint256) envfree;
    function convertToAssets(uint256)     external returns (uint256) envfree;
    function maxDeposit(address)          external returns (uint256) envfree;
    function maxMint(address)             external returns (uint256) envfree;
    function maxWithdraw(address)         external returns (uint256) envfree;
    function maxRedeem(address)           external returns (uint256) envfree;
    function previewDeposit(uint256)      external returns (uint256) envfree;
    function previewMint(uint256)         external returns (uint256) envfree;
    function previewWithdraw(uint256)     external returns (uint256) envfree;
    function previewRedeem(uint256)       external returns (uint256) envfree;

    // ---- summaries ----
    // Trusted, not proved. ERC4626 only calls this overload, so summarizing it bypasses Math
    // entirely; the 3-arg overload is deliberately left unbound because it would never fire.
    function _.mulDiv(uint256 x, uint256 y, uint256 d, Math.Rounding r) internal
        => mulDivCVL(x, y, d, r) expect uint256;

    // Asset token, modelled as ghost state. See erc20-cvl.spec for what this leaves out.
    function _.safeTransfer(address token, address to, uint256 v) internal
        => safeTransferCVL(token, executingContract, to, v) expect void;
    function _.safeTransferFrom(address token, address from, address to, uint256 v) internal
        => safeTransferFromCVL(token, executingContract, from, to, v) expect void;
    function _.balanceOf(address account) external
        => balanceByToken[calledContract][account] expect uint256;

    // Constructor-only. Feeds _underlyingDecimals, which only decimals() reads and no rule here does.
    function _.tryGetDecimals(address token) internal
        => tryGetDecimalsCVL() expect (bool, uint8);
}

/// Scope assumptions, applied by every rule. A vault whose asset is itself, or the zero address, is
/// not a configuration this suite reasons about.
definition sane() returns bool = asset() != currentContract && asset() != 0;

/// The virtual-asset design computes totalAssets() + 1 and totalSupply() + 10**offset, so a vault
/// holding the entire uint256 range reverts in every conversion. Value rules prune that state on
/// their own, because the preview call they compare against is the thing that reverts. Liveness
/// rules cannot rely on that and must exclude it by name.
definition noVirtualOverflow() returns bool =
    totalAssets() < max_uint256 && totalSupply() < max_uint256;
