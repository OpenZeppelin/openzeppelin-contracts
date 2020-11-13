pragma solidity ^0.5.0;

import './UpgradeabilityBeaconProxy.sol';
import '../utils/Address.sol';
import './IBeacon.sol';

/**
 * @title AdminUpgradeabilityBeaconProxy
 * @notice A UpgradeabilityBeaconProxy with the ability for an admin to change the Beacon used.
 * @dev All external functions in this contract must be guarded by the `ifAdmin` modifier.
 */
contract AdminUpgradeabilityBeaconProxy is UpgradeabilityBeaconProxy {
  /**
   * @dev Emitted when the administration has been transferred.
   * @param previousAdmin Address of the previous admin.
   * @param newAdmin Address of the new admin.
   */
  event AdminChanged(address previousAdmin, address newAdmin);

  /**
   * @dev Emitted when the beacon is changed.
   * @param beacon Address of the new beacon.
   */
  event BeaconChanged(address indexed beacon, bytes data);

  /**
   * @dev Storage slot with the admin of the contract.
   * This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1, and is
   * validated in the constructor.
   */

  bytes32 internal constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

  /**
   * @notice Creates a new proxy and optionally calls an initialize funcion defined in the implementation.
   * @param beacon The address of the Beacon contract which defines the logic to use for this proxy.
   * @param admin Address of the proxy administrator.
   * @param data The calldata to initialize this proxy, or empty if no initialization is required.
   */
  constructor(address beacon, address admin, bytes memory data) public payable UpgradeabilityBeaconProxy(beacon, data) {
    assert(ADMIN_SLOT == bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1));
    require(admin != address(0), "An admin address is required");
    _setAdmin(admin);
  }

  /**
   * @dev Modifier to check whether the `msg.sender` is the admin.
   * If it is, it will run the function. Otherwise, it will delegate the call
   * to the implementation.
   */
  modifier ifAdmin() {
    if (msg.sender == _admin()) {
      _;
    } else {
      _fallback();
    }
  }

  /**
   * @return The address of the proxy admin.
   */
  function admin() external ifAdmin returns (address) {
    return _admin();
  }

  /**
   * @return The address of the beacon.
   */
  function beacon() external ifAdmin returns (address) {
    return _beacon();
  }

  /**
   * @return The address of the implementation.
   */
  function implementation() external ifAdmin returns (address) {
    return _implementation();
  }

  /**
   * @dev Changes the admin of the proxy.
   * Only the current admin can call this function.
   * @param newAdmin Address to transfer proxy administration to.
   */
  function changeAdmin(address newAdmin) external ifAdmin {
    require(newAdmin != address(0), "Cannot change the admin of a proxy to the zero address");
    emit AdminChanged(_admin(), newAdmin);
    _setAdmin(newAdmin);
  }

  /**
   * @dev Update the beacon used by this proxy and call a function on the new implementation.
   * Only the admin can call this function.
   * @param newBeacon The address of the Beacon contract which defines the logic to use for this proxy.
   * @param data The calldata to initialize this proxy, or empty if no initialization is required.
   */
  function changeBeaconToAndCall(address newBeacon, bytes calldata data) external payable ifAdmin {
    _setBeacon(newBeacon, data);
    emit BeaconChanged(newBeacon, data);
  }

  /**
   * @return The admin slot.
   */
  function _admin() internal view returns (address adm) {
    bytes32 slot = ADMIN_SLOT;
    assembly {
      adm := sload(slot)
    }
  }

  /**
   * @dev Sets the address of the proxy admin.
   * @param newAdmin Address of the new proxy admin.
   */
  function _setAdmin(address newAdmin) internal {
    bytes32 slot = ADMIN_SLOT;

    assembly {
      sstore(slot, newAdmin)
    }
  }

  /**
   * @dev Only fall back when the sender is not the admin.
   */
  function _willFallback() internal {
    require(msg.sender != _admin(), "Cannot call fallback function from the proxy admin");
    super._willFallback();
  }
}