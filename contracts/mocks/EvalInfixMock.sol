// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/EvalInfix.sol";

contract EvalInfixMock {

    function getResult() external pure returns(bool){
        return (true || false && false);  //straight -> false , precedence -> true
    }

    function checkValid(string[] memory tokens,uint noOfValues,uint noOfOperands) external view returns(bool check) {
        try this.evaluateExp(tokens,noOfValues,noOfOperands) returns(bool){
            check = true;
        }
        catch{
            check = false;
        }
    }

    function evaluateExp(string[] memory tokens,uint noOfValues,uint noOfOperands) external pure returns (bool) {
        return EvalInfix.evaluate(tokens, noOfValues, noOfOperands);
    }

}