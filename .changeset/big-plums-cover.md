---
'openzeppelin-solidity': major
---

Replaces abi.encodeWithSelector & abi.encodeWithSignature with abi.encodeCall

- WHAT the breaking change is

  - The change replaces all occurences of abi.encodeWithSelector & abi.encodeWithSignature with abi.ecnodeCall

- WHY the change was made

  - `abi.encodeWithSelector & abi.encodeWithSignature` can use with `interface.<function>.selector` to prevent `typo error`, but it `doesn't provide type checking`.

- HOW a consumer should update their code

  ````
  interface miniERC20 {

      function transfer(address to, uint256 value) external;
  }

  // works successfully
  function transferData(uint256 to, uint256 value) public pure returns (bytes memory) {
      return abi.encodeWithSelector(miniERC20.transfer.selector, to, value);
  }```
  ````

`abi.encodeCall` provides type checking during compile time.

```
function transferData(uint256 to, uint256 value) public pure returns (bytes memory) {
    return abi.encodeCall(miniERC20.transfer, (to, value));
}
```

```
error[5407]: TypeError: Cannot implicitly convert component at position 0 from "uint256" to "address".
```

`abi.encodeCall(function pointer, (function arguments...))`
