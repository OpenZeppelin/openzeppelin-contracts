// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";


/**
 * @dev Contract module extension of Ownable where the owner can sell the contract ownership
 * or approve a proxy to make a sale.
 *
 * This module is used through inheritance. 
 * 
 * Ownable contract has been copied inside this contract because its critical methods cannot and should not be inherited
 */
abstract contract Sellable is Context {

    uint256 private _ownershipSellingPrice;
    bool private _sellingOwnershipApproved = false;
    bool private _proxyApproved = false;
    address private _approvedBuyer = address(0);
    address private _approvedProxy = address(0);


    /**
    * @dev Above attributes and methods are a copy of Ownable contract
    */

    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }


    /**
    * @dev end of Ownable contract copy
    */



    /**
     * @dev Methods for approving a Buyer address to buy the contract ownership at given price
     */

    /**
     * @dev Approve a buyer address to buy the contract ownership with given price
     * Can only be called by the current owner
     */
    function approveSellingOwnership(address approvedBuyer, uint256 price) public virtual onlyOwner {
        require(approvedBuyer != address(0), "Sellable: approved buyer is the zero address");
        require(approvedBuyer != owner(), "Sellable: approved buyer is the current owner");
        require(!_sellingOwnershipApproved, 'Sellable: a buyer has already been approved, call cancelSellingOwnership first to change it');
        require(price > 0, "Sellable: price must be > 0");

        _sellingOwnershipApproved = true;
        _ownershipSellingPrice = price;
        _approvedBuyer = approvedBuyer;
    }

    /**
     * @dev Cancel precedent call to approveSellingOwnership
     * Can only be called by the current owner
     */
    function cancelSellingOwnership() public virtual onlyOwner {
        _sellingOwnershipApproved=false;
        _approvedBuyer=address(0);
    }

    /**
     * @dev Allow anyone to check if an adress is the approved buyer
     */
    function isApprovedBuyer(address buyer) public virtual view returns(bool){
        return (_sellingOwnershipApproved && buyer == _approvedBuyer); 
    } 

    /**
     * @dev Allow the approved buyer and owner to check the selling approval status
     */
    function isSellingOwnershipApproved() public virtual view onlyOwner returns(bool){
        return _sellingOwnershipApproved;
    }    

    /**
     * @dev Allow the approved buyer and owner to get the approved selling price
     */
    function getOwnershipSellingPrice() public virtual view returns(uint256){
        require(_msgSender() == _approvedBuyer || _msgSender() == owner(), "Sender is not the approved buyer or owner");
        require(_sellingOwnershipApproved, "Buying contract is not approved");
        return _ownershipSellingPrice;
    }

    /**
     * @dev Allow the approved buyer to buy the ownership of the contract with the approved selling price
     * 
     * NOTES:
     * i) Only the selling price is transfered to the owner here, the rest of the contract's balance
     * will stay unchanged, so the owner should first withdraw before selling.
     * 
     * ii) In payable methods the contract balance is updated directly when the method is called and
     * gets msg.value added to it. So we can call payable(owner()).transfer(msg.value) here.
     */
    function buyOwnership() public virtual payable {
        require(_msgSender() == _approvedBuyer, "Sender is not the approved buyer");
        require(_sellingOwnershipApproved, "Buying contract ownership is not approved");        
        require(msg.value == _ownershipSellingPrice, "Selling price incorrect");
        payable(owner()).transfer(msg.value);
        _reset();
        _setOwner(_msgSender());
    }



    /**
     * @dev Methods for approving a proxy address transfer the contract ownership
     */


    /**
     * @dev Approve a trusted proxy to get ownership of the contract in order to make a sale
     * as it is done for tokens with approve method
     */
    function approveProxy(address approvedProxy) public virtual onlyOwner {
        require(approvedProxy != address(0), "Sellable: approved proxy is the zero address");
        require(approvedProxy != owner(), "Sellable: approved proxy is the current owner");
        require(!_proxyApproved, 'Sellable: a proxy has already been approved, call cancelApproveProxy first to change it');

        _proxyApproved = true;
        _approvedProxy = approvedProxy;
    }

    /**
     * @dev Cancel precedent call to approveProxy
     * Can only be called by the current owner
     */
    function cancelApproveProxy() public virtual onlyOwner {
        _proxyApproved=false;
        _approvedProxy=address(0);
    }

    /**
     * @dev Allow anyone to check if an adress is the approved proxy
     */
    function isApprovedProxy(address proxy) public virtual view returns(bool){
        return (_proxyApproved && proxy == _approvedProxy); 
    }     

    /**
     * @dev Allow the owner to check the proxy approved status
     */
    function isProxyApproved() public virtual view onlyOwner returns(bool){
        return _proxyApproved;
    }     

    /**
     * @dev Allow the approved proxy to transfer the ownership of the contract 
     * 
     * NOTES: This should be used for selling contracts on trusted market places
     * For private and safe sales, use the buyOwnership method
     * 
     * Only the proxy can use this method. If the owner wants to manually transfer the contract for free,
     * he/she should use the transferOwnership method instead.
     */
    function proxyTransferOwnership(address newOwner) public virtual {
        require(_msgSender() == _approvedProxy, "Sellable: sender is not the approved proxy");
        require(_proxyApproved, "Sellable: transfering contract ownership to proxy is not approved");        
        require(newOwner != address(0), "Sellable: new owner is the zero address");
        _reset(); // reset buyer and proxy values before transfering ownership
        _setOwner(newOwner);
    }

    function _reset() private {
        _sellingOwnershipApproved=false;
        _proxyApproved=false;
        _approvedProxy=address(0);
        _approvedBuyer=address(0);
     }    

}
