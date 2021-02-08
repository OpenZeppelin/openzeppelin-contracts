// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./VTable.sol";
import "./modules/VTableUpdateModule.sol";
import "../../proxy/Proxy.sol";
import "../../utils/Context.sol";

/**
 * @title VTableProxy
 * @dev TODO
 */
contract VTableProxy is Proxy, Context {
    using VTable for VTable.VTableStore;

    bytes4 private constant _FALLBACK_SIGN = 0xffffffff;

    constructor(address updatemodule) {
        VTable.VTableStore storage vtable = VTable.instance();

        vtable.owner = _msgSender();
        vtable.setFunction(VTableUpdateModule(updatemodule).updateVTable.selector, updatemodule);
    }

    function _implementation() internal view virtual override returns (address module) {
        VTable.VTableStore storage vtable = VTable.instance();

        module = vtable.getFunction(msg.sig);
        if (module != address(0)) return module;

        module = vtable.getFunction(_FALLBACK_SIGN);
        if (module != address(0)) return module;

        revert("VTableProxy: No implementation found");
    }
}
