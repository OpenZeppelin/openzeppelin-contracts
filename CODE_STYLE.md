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

  The exception are the parameters of events. There is no chance of ambiguity
  with these, so they should not have underscores. Not even if they are
  specified on an ERC with underscores; removing them doesn't change the ABI,
  so we should be consistent with the rest of the events in this repository
  and remove them.

* Internal and private state variables should have an underscore suffix.

    ```
    contract TestContract {
      uint256 internal internalVar_;
      uint256 private privateVar_;
    }
    ```

  Variables declared in a function should not follow this rule.

    ```
    function test() {
      uint256 functionVar;
      ...
    }
    ```

* Internal and private functions should have an underscore prefix.

    ```
    function _testInternal() internal {
      ...
    }
    ```

    ```
    function _testPrivate() private {
      ...
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
