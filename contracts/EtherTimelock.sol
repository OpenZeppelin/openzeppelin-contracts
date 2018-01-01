pragma solidity ^0.4.17;

/**
 * @title EtherTimelock
 * @dev EtherTimelock is a contract that will allow a
 * beneficiary to extract ether sent to it after a given release time
 */
contract EtherTimelock {
    //beneficiary of funds
    address public beneficiary;

    //timestamp when funds are able to be released
    uint64 public releaseTime;

    function EtherTimelock(address _beneficiary, uint64 _releaseTime) {
        require(_releaseTime > now && _beneficiary != address(0));

        beneficiary = _beneficiary;
        releaseTime = _releaseTime;
    }

   /**
   * @notice Transfers funds held by timelock to beneficiary.
   */
    function release() public { 
        require(now > releaseTime && this.balance > 0);

        beneficiary.transfer(this.balance);
    }

    function () payable {
        
    }
}
