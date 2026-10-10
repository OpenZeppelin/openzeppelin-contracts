// Closed-form model of Math.mulDiv. Definitions only - no methods block, so this file is safe to
// import anywhere. Activation lives in ERC4626Base.spec.
//
// Adapted from Certora's AutoProver summaries for 512-bit mulDiv. Trusted, not proved: rules that
// rely on it are conditional on this matching Math.mulDiv in both value and revert domain.

function mulDivDownSummary(uint256 x, uint256 y, uint256 denominator) returns uint256 {
    mathint result;
    if (denominator == 0) revert();
    result = x * y / denominator;
    if (result >= 2^256) revert();
    return assert_uint256(result);
}

function mulDivUpSummary(uint256 x, uint256 y, uint256 denominator) returns uint256 {
    mathint result;
    if (denominator == 0) revert();
    result = (x * y + denominator - 1) / denominator;
    if (result >= 2^256) revert();
    return assert_uint256(result);
}

/// Mirrors Math.unsignedRoundsUp over Math.Rounding { Floor, Ceil, Trunc, Expand }.
definition roundsUpCVL(Math.Rounding r) returns bool = assert_uint8(r) % 2 == 1;

function mulDivCVL(uint256 x, uint256 y, uint256 d, Math.Rounding rounding) returns uint256 {
    return roundsUpCVL(rounding) ? mulDivUpSummary(x, y, d) : mulDivDownSummary(x, y, d);
}
