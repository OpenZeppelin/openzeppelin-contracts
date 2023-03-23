// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (proxy/transparent/TransparentUpgradeableProxy.sol)

pragma solidity ^0.8.0;

import "../ERC1967/ERC1967Proxy.sol";

interface ITransparentUpgradeableProxy {
    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);
    function admin() external returns (address);
    function implementation() external returns (address);
    function changeAdmin(address) external;
    function upgradeTo(address) external;
    function upgradeToAndCall(address, bytes memory) payable external;
}

/**
 * @dev This contract implements a proxy that is upgradeable by an admin.
 *
 * To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector
 * clashing], which can potentially be used in an attack, this contract uses the
 * https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two
 * things that go hand in hand:
 *
 * 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if
 * that call matches one of the admin functions exposed by the proxy itself.
 * 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the
 * implementation. If the admin tries to call a function on the implementation it will fail with an error that says
 * "admin cannot fallback to proxy target".
 *
 * These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing
 * the admin, so it's best if it's a dedicated account that is not used for anything else. This will avoid headaches due
 * to sudden errors when trying to call a function from the proxy implementation.
 *
 * Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,
 * you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.
 */
contract TransparentUpgradeableProxy is ERC1967Proxy {
    /**
     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and
     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.
     */
    constructor(address _logic, address admin_, bytes memory _data) payable ERC1967Proxy(_logic, _data) {
        _changeAdmin(admin_);
    }

    /**
     * @dev If caller is the admin process the call internally, otherwize transparently fallback to the proxy behavior
     */
    function _fallback() internal virtual override {
        if (msg.sender == _getAdmin()) {
            bytes4 selector = msg.sig;
            if (selector == ITransparentUpgradeableProxy.admin.selector) {
                // Returns the current admin.
                //
                // TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the
                // https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.
                // `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`
                _requireZeroValue();
                address admin = _getAdmin();
                assembly {
                    mstore(0x00, admin)
                    return(0, 0x20)
                }
            } else if (selector == ITransparentUpgradeableProxy.implementation.selector) {
                // Returns the current implementation.
                // TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the
                // https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.
                // `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
                _requireZeroValue();
                address implementation = _implementation();
                assembly {
                    mstore(0x00, implementation)
                    return(0, 0x20)
                }
            } else if (selector == ITransparentUpgradeableProxy.changeAdmin.selector) {
                // Changes the admin of the proxy.
                _requireZeroValue();
                address newAdmin = abi.decode(msg.data[4:], (address));
                _changeAdmin(newAdmin);
            } else if (selector == ITransparentUpgradeableProxy.upgradeTo.selector) {
                // Upgrade the implementation of the proxy.
                _requireZeroValue();
                address newImplementation = abi.decode(msg.data[4:], (address));
                _upgradeToAndCall(newImplementation, bytes(""), false);
            } else if (selector == ITransparentUpgradeableProxy.upgradeToAndCall.selector) {
                // Upgrade the implementation of the proxy, and then call a function from the new implementation as specified
                // by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the
                // proxied contract.
                (address newImplementation, bytes memory data) = abi.decode(msg.data[4:], (address, bytes));
                _upgradeToAndCall(newImplementation, data, true);
            } else {
                revert('TransparentUpgradeableProxy: admin cannot fallback to proxy target');
            }
        } else {
            super._fallback();
        }
    }

    /**
     * @dev Returns the current admin.
     */
    function _admin() internal view virtual returns (address) {
        return _getAdmin();
    }

    /**
     * @dev To keep this contract fully transparent, all `ifAdmin` functions must be payable. This helper is here to
     * emulate some proxy functions being non-payable while still allowing value to pass through.
     */
    function _requireZeroValue() private {
        require(msg.value == 0);
    }
}
