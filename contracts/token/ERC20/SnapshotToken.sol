pragma solidity ^0.4.23;

import { StandardToken } from "./StandardToken.sol";
import { ArrayUtils } from "../../utils/ArrayUtils.sol";


/**
 * @title SnapshotToken
 *
 * @dev An ERC20 token which enables taking snapshots of accounts' balances.
 * @dev This can be useful to safely implement voting weighed by balance.
 */
contract SnapshotToken is StandardToken {
  using ArrayUtils for uint256[];

  // The 0 id represents no snapshot was taken yet.
  uint256 private currSnapshotId;

  mapping (address => uint256[]) private snapshotIds;
  mapping (address => uint256[]) private snapshotBalances;

  event Snapshot(uint256 id);

  function transfer(address _to, uint256 _value) public returns (bool) {
    _updateSnapshot(msg.sender);
    _updateSnapshot(_to);
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    _updateSnapshot(_from);
    _updateSnapshot(_to);
    return super.transferFrom(_from, _to, _value);
  }

  function snapshot() public returns (uint256) {
    currSnapshotId += 1;
    emit Snapshot(currSnapshotId);
    return currSnapshotId;
  }

  function balanceOfAt(address _account, uint256 _snapshotId) public view returns (uint256) {
    require(_snapshotId > 0 && _snapshotId <= currSnapshotId);

    uint256 idx = snapshotIds[_account].findUpperBound(_snapshotId);

    if (idx == snapshotIds[_account].length) {
      return balanceOf(_account);
    } else {
      return snapshotBalances[_account][idx];
    }
  }

  function _updateSnapshot(address _account) internal {
    if (_lastSnapshotId(_account) < currSnapshotId) {
      snapshotIds[_account].push(currSnapshotId);
      snapshotBalances[_account].push(balanceOf(_account));
    }
  }

  function _lastSnapshotId(address _account) internal returns (uint256) {
    uint256[] storage snapshots = snapshotIds[_account];

    if (snapshots.length == 0) {
      return 0;
    } else {
      return snapshots[snapshots.length - 1];
    }
  }
}
