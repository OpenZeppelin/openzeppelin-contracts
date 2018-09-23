pragma solidity ^0.4.24;

import "./ERC20.sol";
import "../../utils/Arrays.sol";


/**
 * @title ERC20Snapshot token
 * @dev An ERC20 token which enables taking snapshots of account balances.
 * This can be useful to safely implement voting weighed by balance.
 */
contract ERC20Snapshot is ERC20 {
  
  using Arrays for uint256[];

  // The 0 id represents no snapshot was taken yet.
  uint256 private currentSnapshotId;

  mapping (address => uint256[]) private snapshotIds;
  mapping (address => uint256[]) private snapshotBalances;

  event Snapshot(uint256 id);

  /**
   * @dev Increments current snapshot. Emites Snapshot event.
   * @return An uint256 representing current snapshot id.
   */
  function snapshot() external returns (uint256) {
    currentSnapshotId += 1;
    emit Snapshot(currentSnapshotId);
    return currentSnapshotId;
  }

  /**
   * @dev Returns account balance for specific snapshot.
   * @param account address The address to query the balance of.
   * @param snapshotId uint256 The snapshot id for which to query the balance of.
   * @return An uint256 representing the amount owned by the passed address for specific snapshot.
   */
  function balanceOfAt(
    address account,
    uint256 snapshotId
  )
    public
    view
    returns (uint256)
  {
    require(snapshotId > 0 && snapshotId <= currentSnapshotId);

    uint256 idx = snapshotIds[account].findUpperBound(snapshotId);

    if (idx == snapshotIds[account].length) {
      return balanceOf(account);
    } else {
      return snapshotBalances[account][idx];
    }
  }

  /**
  * @dev Transfer token for a specified address. It takes balance snapshot for the sender and recipient account
  * before transfer is done.
  * @param to The address to transfer to.
  * @param value The amount to be transferred.
  */
  function transfer(address to, uint256 value) public returns (bool) {
    updateSnapshot(msg.sender);
    updateSnapshot(to);
    return super.transfer(to, value);
  }

  /**
   * @dev Transfer tokens from one address to another. It takes balance snapshot of both accounts before
   * the transfer is done.
   * @param from address The address which you want to send tokens from
   * @param to address The address which you want to transfer to
   * @param value uint256 the amount of tokens to be transferred
   */
  function transferFrom(
    address from,
    address to,
    uint256 value
  ) 
    public
    returns (bool)
  {
    updateSnapshot(from);
    updateSnapshot(to);
    return super.transferFrom(from, to, value);
  }

  /**
   * @dev Internal function that mints an amount of the token and assigns it to
   * an account. This encapsulates the modification of balances such that the
   * proper events are emitted. Takes snapshot before tokens are minted.
   * @param account The account that will receive the created tokens.
   * @param amount The amount that will be created.
   */
  function _mint(address account, uint256 amount) internal {
    updateSnapshot(account);
    super._mint(account, amount);
  }

  /**
   * @dev Internal function that burns an amount of the token of a given
   * account. Takes snapshot before tokens are burned.
   * @param account The account whose tokens will be burnt.
   * @param amount The amount that will be burnt.
   */
  function _burn(address account, uint256 amount) internal {
    updateSnapshot(account);
    super._burn(account, amount);
  }

  function updateSnapshot(address account) private {
    if (lastSnapshotId(account) < currentSnapshotId) {
      snapshotIds[account].push(currentSnapshotId);
      snapshotBalances[account].push(balanceOf(account));
    }
  }

  function lastSnapshotId(address account) private view returns (uint256) {
    uint256[] storage snapshots = snapshotIds[account];
    if (snapshots.length == 0) {
      return 0;
    } else {
      return snapshots[snapshots.length - 1];
    }
  }
  
}
