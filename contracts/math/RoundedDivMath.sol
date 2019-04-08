pragma solidity ^0.5.2;

/**
 * @title RoundedDivMath
 * @author https://crypto.tickets team
 * @dev div methods with different rounding
 * Example how you can use it:
 *
 *	function unitsToCents(uint _value) public view returns(uint){
 *    // imagine: 100 units==1 cent
 *    // 49 units -> 0 cents
 *    // 50 units -> 0 cents
 *    // 51 units -> 1 cents
 *
 *    // 149 units -> 1 cents
 *    // 150 units -> 2 cents
 *    // 151 units -> 2 cents
 *
 *    // 249 units -> 2 cents
 *    // 250 units -> 2 cents
 *    // 251 units -> 3 cents
 *    return bankersRoundedDiv(_value, 100);
 *	}
 */
library RoundedDivMath {
    /**
     * @dev Division, round to nearest integer (AKA round-half-up)
     * @param a What to divide
     * @param b Divide by this number
     */
    function roundedDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity automatically throws, but please emit reason
        require(b > 0, "div by 0"); 

        uint256 halfB = (b % 2 == 0) ? (b / 2) : (b / 2 + 1);
        return (a % b >= halfB) ? (a / b + 1) : (a / b);
    }

    /**
     * @dev bankersRoundedDiv method that is used to divide and round the result 
     * (AKA round-half-to-even)
     *
     * Bankers Rounding is an algorithm for rounding quantities to integers, 
     * in which numbers which are equidistant from 
     * the two nearest integers are rounded to the nearest even integer. 
     *
     * Thus, 0.5 rounds down to 0; 1.5 rounds up to 2. 
     * Other decimal fractions round as you would expect--0.4 to 0, 0.6 to 1, 1.4 to 1, 1.6 to 2, etc. 
     * Only x.5 numbers get the "special" treatment.
     * @param a What to divide
     * @param b Divide by this number
     */
    function bankersRoundedDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "div by 0"); 

        uint256 halfB = 0;
        if ((b % 2) == 1) {
            halfB = (b / 2) + 1;
        } else {
            halfB = b / 2;
        }
        bool roundUp = ((a % b) >= halfB);

        // now check if we are in the center!
        bool isCenter = ((a % b) == (b / 2));
        bool isDownEven = (((a / b) % 2) == 0);

        // select the rounding type
        if (isCenter) {
            // only in this case we rounding either DOWN or UP 
            // depending on what number is even 
            roundUp = !isDownEven;
        }

        // round
        if (roundUp) {
            return ((a / b) + 1);
        }else{
            return (a / b);
        }
    }
}
