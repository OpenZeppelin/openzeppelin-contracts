/**
 * @title Interface ERC20 SnapshotToken (abstract contract)
 * @author Validity Labs AG <info@validitylabs.org>
 */

pragma solidity ^0.5.2;

contract IERC20Snapshot {
    /**
    * @dev Queries the balance of `owner` AFTER a specific `blockNumber` has been appended
    * @param owner The address from which the balance will be retrieved
    * @param blockNumber The block number when the balance is queried
    * @return The balance AFTER `blockNumber`
    */
    function balanceOfAt(
        address owner,
        uint blockNumber
    )
    public
    view
    returns (uint256)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
    * @notice Total amount of tokens AFTER a specific `blockNumber`.
    * @param blockNumber The block number when the totalSupply is queried
    * @return The total amount of tokens AFTER `blockNumber`
    */
    function totalSupplyAt(uint blockNumber)
        public
        view
        returns(uint256)
    {
        // solhint-disable-previous-line no-empty-blocks
    }
}
