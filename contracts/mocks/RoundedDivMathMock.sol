pragma solidity ^0.5.2;

import "../math/RoundedDivMath.sol";

contract RoundedDivMathMock {
    // for tests only
    function unitsToCentsRounded(uint _value) public pure returns(uint){
        // imagine: 100 units==1 cent

        // 49 units -> 0 cents 
        // 50 units -> 0 cents 
        // 51 units -> 1 cents 

        // 149 units -> 1 cents 
        // 150 units -> 1 cents 
        // 151 units -> 2 cents 

        // 249 units -> 2 cents  
        // 250 units -> 2 cents 
        // 251 units -> 3 cents  
        return roundedDiv(_value, 100);
    }

    function unitsToCentsBankers(uint _value) public pure returns(uint){
        // imagine: 100 units==1 cent

        // 49 units -> 0 cents 
        // 50 units -> 0 cents 
        // 51 units -> 1 cents 

        // 149 units -> 1 cents 
        // 150 units -> 2 cents 
        // 151 units -> 2 cents 

        // 249 units -> 2 cents  
        // 250 units -> 2 cents 
        // 251 units -> 3 cents  
        return bankersRoundedDiv(_value, 100);
    }

    function roundedDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return RoundedDivMath.roundedDiv(a, b);
    }

    function bankersRoundedDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return RoundedDivMath.bankersRoundedDiv(a, b);
    }

}
