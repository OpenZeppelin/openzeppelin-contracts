// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../VTable.sol";
import "../../../utils/Context.sol";

contract VTableOwnershipModule is Context {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "VTableOwnership: caller is not the owner");
        _;
    }

    /**
     * @dev Reads ownership for the vtable
     */
    function owner() public view virtual returns (address) {
        return VTable.instance().owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        VTable.VTableStore storage vtable = VTable.instance();

        emit OwnershipTransferred(vtable.owner, address(0));
        vtable.owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        VTable.VTableStore storage vtable = VTable.instance();

        require(newOwner != address(0), "VTableOwnership: new owner is the zero address");
        emit OwnershipTransferred(vtable.owner, newOwner);
        vtable.owner = newOwner;
    }
}
