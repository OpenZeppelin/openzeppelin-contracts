pragma solidity ^0.5.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions. Ownership manipulations are protected from accidents
 * that could otherwise result in lockouts.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the current owner.
 */
contract OwnableCautious {
    address private _owner;
    address private _newOwner;

    event AuthorizedOwnershipTransfer(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Returns the address of the (pending/authorized) new owner.
     */
    function newOwner() public view returns (address) {
        return _newOwner;
    }

    /**
     * @dev Reverts if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), 'OwnableCautious: Caller must be the owner');
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Leaves the contract without an owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner
     * or any possibilty of ever having an owner... thereby removing any
     * functionality that is only available to an owner.
     */
    function renounceOwnership(bool confirm) public onlyOwner {
        require(confirm, 'OwnableCautious: To confirm renunciation `confirm` must be true');
        emit OwnershipTransferred(_owner, address(0));
        if(_newOwner != address(0)){delete(_newOwner);}
        delete(_owner);
    }

    /**
     * @dev Begins transfer of ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function authorizeTransferOwnership(address authorized) public onlyOwner {
        emit AuthorizedOwnershipTransfer(_owner, authorized);
        _newOwner = authorized;
    }

    /**
     * @dev Completes transfer of ownership of the contract.
     * Can only be called by the previously specified contract recipient address (`_newOwner`).
     */
    function transferOwnership() public {
        require(msg.sender == _newOwner, 'OwnableCautious: only the previously specified new owner may accept ownership transfer');
        emit OwnershipTransferred(_owner, _newOwner);
        _owner = _newOwner;
        delete(_newOwner);
    }
}