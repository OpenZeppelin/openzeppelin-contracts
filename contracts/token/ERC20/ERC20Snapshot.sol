/**
 * @title ERC20 Snapshot Token
 * inspired by Jordi Baylina's MiniMeToken to record historical balances
 * @author Validity Labs AG <info@validitylabs.org>
 */

pragma solidity ^0.5.2;

import "../../math/SafeMath.sol";
import "./ERC20.sol";
import "./IERC20Snapshot.sol";

contract ERC20Snapshot is ERC20, IERC20Snapshot {
    using SafeMath for uint256;

    /**
    * @dev `Snapshot` is the structure that attaches a block number to a
    * given value. The block number attached is the one that last changed the value
    */
    struct Snapshot {
        uint128 fromBlock;  // `fromBlock` block.number
        uint128 value;  // `value` is the amount of tokens
    }

    /**
    * @dev `_snapshotBalances` is the map that tracks the balance of each address, in this
    * contract when the balance changes the block number that the change
    * occurred is also included in the map
    */
    mapping (address => Snapshot[]) private _snapshotBalances;

    // Tracks the history of the `totalSupply` of the token
    Snapshot[] private _snapshotTotalSupply;

    /*** FUNCTIONS ***/
    /** OVERRIDE
    * @dev Send `value` tokens to `to` from `msg.sender`
    * @param to The address of the recipient
    * @param value The amount of tokens to be transferred
    * @return Whether the transfer was successful or not
    */
    function transfer(address to, uint256 value) public returns (bool result) {
        result = super.transfer(to, value);
        createSnapshot(msg.sender, to);
    }

    /** OVERRIDE
    * @dev Send `value` tokens to `to` from `from` on the condition it is approved by `from`
    * @param from The address holding the tokens being transferred
    * @param to The address of the recipient
    * @param value The amount of tokens to be transferred
    * @return True if the transfer was successful
    */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool result)
    {
        result = super.transferFrom(from, to, value);
        createSnapshot(from, to);
    }

    /**
    * @dev Queries the balance of `owner` AFTER a specific `blockNumber`
    * @param owner The address from which the balance will be retrieved
    * @param blockNumber The block number when the balance is queried
    * @return The balance AFTER `blockNumber`
    */
    function balanceOfAt(
        address owner,
        uint blockNumber) public view returns (uint256)
    {
        return getValueAt(_snapshotBalances[owner], blockNumber);
    }

    /**
    * @dev Total amount of tokens AFTER a specific `blockNumber`.
    * @param blockNumber The block number when the totalSupply is queried
    * @return The total amount of tokens AFTER `blockNumber`
    */
    function totalSupplyAt(uint blockNumber) public view returns(uint256) {
        return getValueAt(_snapshotTotalSupply, blockNumber);
    }

    /*** Internal functions ***/
    /**
    * @dev Updates snapshot mappings for from and to and emit an event
    * @param from The address holding the tokens being transferred
    * @param to The address of the recipient
    * @return True if the transfer was successful
    */
    function createSnapshot(address from, address to) internal {
        updateValueAtNow(_snapshotBalances[from], balanceOf(from));
        updateValueAtNow(_snapshotBalances[to], balanceOf(to));
    }

    /**
    * @dev `getValueAt` retrieves the number of tokens at a given block number
    * @param checkpoints The history of values being queried
    * @param blockNumber The block number to retrieve the value at
    * @return The number of tokens being queried
    */
    function getValueAt(
        Snapshot[] storage checkpoints,
        uint blockNumber) internal view returns (uint)
    {
        if (checkpoints.length == 0) return 0;

        // Shortcut for the actual value
        if (blockNumber >= checkpoints[checkpoints.length.sub(1)].fromBlock) {
            return checkpoints[checkpoints.length.sub(1)].value;
        }

        if (blockNumber < checkpoints[0].fromBlock) {
            return 0;
        }

        // Binary search of the value in the array
        uint min;
        uint max = checkpoints.length.sub(1);

        while (max > min) {
            uint mid = (max.add(min).add(1)).div(2);
            if (checkpoints[mid].fromBlock <= blockNumber) {
                min = mid;
            } else {
                max = mid.sub(1);
            }
        }
        return checkpoints[min].value;
    }

    /**
    * @dev `updateValueAtNow` used to update the `_snapshotBalances`
    * map and the `_snapshotTotalSupply`
    * @param checkpoints The history of data being updated
    * @param value The new number of tokens
    */
    function updateValueAtNow(
        Snapshot[] storage checkpoints,
        uint value) 
        internal 
    {
        if (
            (checkpoints.length == 0) ||
            (checkpoints[checkpoints.length.sub(1)].fromBlock < block.number)
        ) {
            checkpoints.push(Snapshot(uint128(block.number), uint128(value)));
        } else {
            checkpoints[checkpoints.length.sub(1)].value = uint128(value);
        }
    }

    /** OVERRIDE
    * @dev Internal function that mints an amount of the token and assigns it to
    * an account. This encapsulates the modification of balances such that the
    * proper events are emitted.
    * @param account The account that will receive the created tokens.
    * @param amount The amount that will be created.
    */
    function _mint(address account, uint256 amount) internal {
        super._mint(account, amount);
        updateValueAtNow(_snapshotTotalSupply, totalSupply());
        updateValueAtNow(_snapshotBalances[account], balanceOf(account));
    }

    /** OVERRIDE
    * @dev Internal function that burns an amount of the token of a given
    * account.
    * @param account The account whose tokens will be burnt.
    * @param amount The amount that will be burnt.
    */
    function _burn(address account, uint256 amount) internal {
        super._burn(account, amount);
        updateValueAtNow(_snapshotTotalSupply, totalSupply());
        updateValueAtNow(_snapshotBalances[account], balanceOf(account));
    }

    /** OVERRIDE
    * @dev Internal function that burns an amount of the token of a given
    * account, deducting from the sender's allowance for said account. Uses the
    * internal burn function.
    * @param account The account whose tokens will be burnt.
    * @param amount The amount that will be burnt.
    */
    function _burnFrom(address account, uint256 amount) internal {
        super._burnFrom(account, amount);
        updateValueAtNow(_snapshotTotalSupply, totalSupply());
        updateValueAtNow(_snapshotBalances[account], balanceOf(account));
    }
}
