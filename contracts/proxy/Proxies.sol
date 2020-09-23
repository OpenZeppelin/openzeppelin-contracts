// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./TransparentUpgradeableProxy.sol";

/**
 * @dev Proxy Factory library to create multiple proxy instances at runtime
 *
 * These functions implement a simple Factory pattern that can be used to deploy
 * multiple proxy instances when the implementation contract needs to be reused. 
 */
library Proxies {
  // Contains the address of the implementation used for the proxies it creates.
  struct ProxyFactory { address implementation; }

  /**
   * @dev Returns the ProxyFactory struct with the impementation contract address.
   * 
   * Initializes the factory struct by deploying the implementation contract and
   * storing its address.
  */
  function newFactory(bytes memory creationCode) internal returns (ProxyFactory memory) {
    address implementationAddr = _deployImplementation(creationCode);
    ProxyFactory memory factory = ProxyFactory(implementationAddr);
    return factory;
  }

  /**
   * @dev Deploys a Proxy instance with `admin` and initialized with `initializerData
   *
  */
  function deploy(ProxyFactory storage self,address admin, bytes memory initializerData) internal {
    new TransparentUpgradeableProxy(self.implementation, admin, initializerData);
  }

  /**
   * @dev Returns the address of the deployed implementation contract.
   *
   * Creates the implementation contract with `creationCode`.
  */
  function _deployImplementation(bytes memory creationCode) private returns (address) {
    address payable addr;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      addr := create(0, add(creationCode, 0x20), mload(creationCode))
      if iszero(extcodesize(addr)) {
        revert(0, 0)
      }
    }
    return addr;
  }
}
