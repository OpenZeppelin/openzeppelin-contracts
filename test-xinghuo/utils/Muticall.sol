pragma solidity ^0.8.20;  
  
import {Multicall} from "../../openzeppelin-contracts/contracts/utils/Multicall.sol";  
  
contract MyMuticall is Multicall {  
    uint256 public myNumber;  
  
    function setMyNumber(uint256 _number) external {  
        myNumber = _number;  
    }  
  
    function getMyNumber() external view returns (uint256) {  
        return myNumber;  
    }  
  
    function multicalltest() public returns(uint256, uint256){
        bytes[] memory bytesArray = new bytes[](3);
        bytesArray[0] = abi.encodeWithSelector(this.setMyNumber.selector, 100);
        bytesArray[1] = abi.encodeWithSelector(this.getMyNumber.selector);
        bytesArray[2] = abi.encodeWithSelector(this.getMyNumber.selector);
        bytes[] memory results = this.multicall(bytesArray);

        uint256 valueA = abi.decode(results[1], (uint256));  
        uint256 valueB = abi.decode(results[2], (uint256));

        return (valueA, valueB);
    }  
}