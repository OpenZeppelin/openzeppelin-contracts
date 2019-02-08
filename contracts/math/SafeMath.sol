pragma solidity ^0.5.2;

/**
 * @title SafeMath
 * @dev Unsigned math operations with safety checks that revert on error
 */
library SafeMath {
    /**
     * @dev Multiplies two unsigned integers, reverts on overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256 r) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if iszero(a) {
                return(a, 32)
            }
            r := mul(a, b)
            if iszero(eq(div(r, a), b)) { revert(0, 0) }
        }
    }

    /**
     * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256 r) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if iszero(b) { revert(0, 0) }
            r := div(a, b)
        }
    }

    /**
     * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256 r) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if lt(a, b) { revert(0, 0) }
            r := sub(a, b)
        }
    }

    /**
     * @dev Adds two unsigned integers, reverts on overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256 r) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := add(a, b)
            if lt(r, a) { revert(0, 0) }
        }
    }

    /**
     * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
     * reverts when dividing by zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256 r) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if iszero(b) { revert(0, 0) }
            r := mod(a, b)
        }
    }
}
