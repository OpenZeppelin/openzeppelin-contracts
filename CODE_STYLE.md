# Code Style

We value clean code and consistency, and those are prerequisites for us to
include new code in the repository. Before proposing a change, please read this
document and take some time to familiarize yourself with the style of the
existing codebase.

## Solidity code

In order to be consistent with all the other Solidity projects, we follow the
[official recommendations documented in the Solidity style guide](http://solidity.readthedocs.io/en/latest/style-guide.html).

Any exception or additions specific to our project are documented below.

### Naming

* Try to avoid acronyms and abbreviations.

* Parameters must be prefixed with an underscore.

    ```
    function test(uint256 _testParameter1, uint256 _testParameter2) {
    ...
    }
    ```

* Internal state variables should have an underscore suffix: by internal state
  variable we mean any variable with no modifier or with the internal or private
  modifiers whose scope is not a function. For instance, variables that are
  declared in a function should not follow this rule.


    ```
    contract myContract{

      uint256 internalVar_;
      uint256 public publicVar;

      function test(uint256 _testParameter1, uint256 _testParameter2) {
        uint256 functionVar;
        ...
      }

    }
    ```

* Events should be emitted immediately after the state change that they
  represent, and consequently they should be named in past tense.

    ```
    function _burn(address _who, uint256 _value) internal {
      super._burn(_who, _value);
      emit TokensBurned(_who, _value);
    }
    ```

  Some standards (e.g. ERC20) use present tense, and in those cases the
  standard specification prevails.
>>>>>>> master
