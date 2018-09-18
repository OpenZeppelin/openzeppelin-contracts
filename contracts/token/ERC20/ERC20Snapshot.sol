pragma solidity ^0.4.24;

import "./ERC20.sol";
import "../../utils/Arrays.sol";


/**
 * @title ERC20Snapshot token
 * @dev An ERC20 token which enables taking snapshots of accounts' balances. This can be useful to
 * safely implement voting weighed by balance.
 */
contract ERC20Snapshot is ERC20 {
  
  using Arrays for uint256[];

  // The 0 id represents no snapshot was taken yet.
  uint256 public currentSnapshotId;

  mapping (address => uint256[]) private snapshotIds;
  mapping (address => uint256[]) private snapshotBalances;

  event Snapshot(uint256 id);

  function snapshot() external returns (uint256) {
    currentSnapshotId += 1;
    emit Snapshot(currentSnapshotId);
    return currentSnapshotId;
  }

  function snapshotsLength(address account) external view returns (uint256) {
    return snapshotIds[account].length;
  }

  function balanceOfAt(
    address account,
    uint256 snapshotId
  )
    external 
    view 
    returns (uint256) 
  {
    require(
      snapshotId > 0 && snapshotId <= currentSnapshotId, 
      "Parameter snapshotId has to be greater than 0 and lower/equal currentSnapshot");

    uint256 idx = snapshotIds[account].findUpperBound(snapshotId);

    if (idx == snapshotIds[account].length) {
      return balanceOf(account);
    } else {
      return snapshotBalances[account][idx];
    }
  }

  function transfer(
    address to, 
    uint256 value
  ) 
    public 
    returns (bool) 
  {
    updateSnapshot(msg.sender);
    updateSnapshot(to);
    return super.transfer(to, value);
  }

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

  function updateSnapshot(address account) internal {
    if (lastSnapshotId(account) < currentSnapshotId) {
      snapshotIds[account].push(currentSnapshotId);
      snapshotBalances[account].push(balanceOf(account));
    }
  }

  function lastSnapshotId(address account) internal view returns (uint256) {
    uint256[] storage snapshots = snapshotIds[account];
    if (snapshots.length == 0) {
      return 0;
    } else {
      return snapshots[snapshots.length - 1];
    }
  }
  
}
