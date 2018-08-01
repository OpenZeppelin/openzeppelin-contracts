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

* Parameters must be prefixed with an underscore.

```
function test(uint256 _testParameter1, uint256 _testParameter2) {
    ...
}
```
