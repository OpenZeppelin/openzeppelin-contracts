pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see [ERC20Detailed](#erc20detailed).
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens owned by an account (`who`).
     */
    function balanceOf(address who) external view returns (uint256);

    /**
     * @dev Moves tokens from the caller's account to a specified recipient
     * (`to`). The amount is specified by `value`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `Transfer` event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Configures the amount that a `spender` account is able to spend on
     * behalf of the caller. The amount is specified by `value`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * See `allowance` and `transferFrom`.
     *
     * > Beware that changing an allowance with this method brings the risk
     * that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible
     * solution to mitigate this race condition is to first reduce the
     * spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

     * Emits an `Approval` event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Returns the current allowance that an `owner` has set for a `spender`.
     *
     * This value is updated when either `approve` or `transferFrom` are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Moves tokens from one account (`from`) to another (`to`). The
     * caller must have remaining allowance from the owner (see `approve` and
     * `allowance`). If this operation succeeds, the transferred amount
     * (`value`) is deducted from the caller's allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.

     * Emits a `Transfer` event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Emitted when tokens are moved from one account (`from`) to anoter (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to `approve`. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
