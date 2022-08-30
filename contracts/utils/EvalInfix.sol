// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EvalInfix
 * @author Namit Jain (namit.cs.rdjps@gmail.com)
 * @dev Provides method that can be used to evaluate any Infix Notation Expression which
 *     consist of 1 and 0 as operands .
 *     consist of a (&&) , o (||) , ( , ) as operators.
 *     precedence is also considered for LOGICAL AND (&&) and LOGICAL OR (||)
 */
library EvalInfix {
    /**
     * @dev Compare Two Strings
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /**
     * @dev Evaluate an Infix Expression consist of `1 -> true , 0 -> false , o -> logical OR , a -> logical AND , ( , )`.
     */
    function evaluate(
        string[] memory tokens,
        uint256 noOfValues,
        uint256 noOfOperands
    ) internal pure returns (bool) {
        // Stack for 1 and 0 : "values"
        bool[] memory values = new bool[](noOfValues + 1);
        uint256 valuesLastIndex = 0;

        // Stack for Operators: "ops"(&& => a and || => o)
        string[] memory ops = new string[](noOfOperands + 1);
        uint256 opsLastIndex = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            // Current token is a whitespace or Null Character, skip it
            if (compareStrings(tokens[i], " ")) {
                continue;
            }

            // Current token is a 1 or 0,
            // push it to stack for values
            if (compareStrings(tokens[i], "0")) {
                values[valuesLastIndex++] = false;
            } else if (compareStrings(tokens[i], "1")) {
                values[valuesLastIndex++] = true;
            }
            // Current token is an opening
            // brace, push it to "ops"
            else if (compareStrings(tokens[i], "(")) {
                ops[opsLastIndex++] = tokens[i];
            }
            // Closing brace encountered,
            // solve entire brace
            else if (compareStrings(tokens[i], ")")) {
                while (!compareStrings(ops[opsLastIndex - 1], "(")) {
                    string memory op = ops[opsLastIndex - 1];

                    opsLastIndex = opsLastIndex - 1;

                    bool op1 = values[valuesLastIndex - 1];

                    valuesLastIndex = valuesLastIndex - 1;

                    bool op2 = values[valuesLastIndex - 1];

                    valuesLastIndex = valuesLastIndex - 1;

                    values[valuesLastIndex++] = applyOp(op, op1, op2);
                }
                if (opsLastIndex > 0) opsLastIndex = opsLastIndex - 1;
            }
            // Current token is an operator.
            else if (compareStrings(tokens[i], "o") || compareStrings(tokens[i], "a")) {
                // While top of 'ops' has same
                // or greater precedence to current
                // token, which is an operator.
                // Apply operator on top of 'ops'
                // to top two elements in values stack
                while ((opsLastIndex) > 0 && hasPrecedence(tokens[i], ops[opsLastIndex - 1])) {
                    string memory op = ops[opsLastIndex - 1];

                    opsLastIndex = opsLastIndex - 1;

                    bool op1 = values[valuesLastIndex - 1];

                    valuesLastIndex = valuesLastIndex - 1;

                    bool op2 = values[valuesLastIndex - 1];

                    valuesLastIndex = valuesLastIndex - 1;

                    values[++valuesLastIndex] = applyOp(op, op1, op2);
                }

                // Push current token to "ops".
                ops[opsLastIndex++] = tokens[i];
            }
        }

        // Entire expression has been
        // parsed at this point, apply remaining
        // ops to remaining values
        while (opsLastIndex > 0) {
            string memory op = ops[opsLastIndex - 1];

            opsLastIndex = opsLastIndex - 1;
            bool op1 = values[valuesLastIndex - 1];

            valuesLastIndex = valuesLastIndex - 1;
            bool op2 = values[valuesLastIndex - 1];

            valuesLastIndex = valuesLastIndex - 1;
            values[++valuesLastIndex] = applyOp(op, op1, op2);
        }

        require(valuesLastIndex == 1, "!!Wrong Infix Exp.");

        // Top of "values" contains
        // result, return it
        return values[valuesLastIndex];
    }

    /**
     * @dev Returns true if 'op2' has higher or same precedence as 'op1', otherwise returns false.
     */
    function hasPrecedence(string memory op1, string memory op2) internal pure returns (bool) {
        if (compareStrings(op2, "(") || compareStrings(op2, ")")) {
            return false;
        }
        if (compareStrings(op1, "a") && compareStrings(op2, "o")) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @dev A utility method to apply an operator 'op' on operands 'a' and 'b'. Return the result.
     */
    function applyOp(
        string memory op,
        bool b,
        bool a
    ) internal pure returns (bool) {
        if (compareStrings(op, "a")) return a && b;
        else if (compareStrings(op, "o")) return a || b;
        else return false;
    }
}
