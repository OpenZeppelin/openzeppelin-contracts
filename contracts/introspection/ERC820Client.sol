pragma solidity ^0.4.24;

import "./IERC820.sol";

/**
 * @title ERC820 client implementation
 * @dev https://eips.ethereum.org/EIPS/eip-820
 * @author Bertrand Masius <github@catageeks.tk>
 */
contract ERC820Client {

  IERC820 private _erc820 = IERC820(0x820A8Cfd018b159837d50656c49d28983f18f33c);

  function getInterfaceImplementer(address addr, bytes32 hash) internal view returns(address) {
    return _erc820.getInterfaceImplementer(addr, hash);
  }

  function setInterfaceImplementer(address addr, bytes32 hash, address implementer) internal {
    _erc820.setInterfaceImplementer(addr, hash, implementer);
  }

  function getERC820Registry() public view returns(address) {
    return address(_erc820);
  }
}
