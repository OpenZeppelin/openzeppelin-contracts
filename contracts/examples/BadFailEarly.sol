pragma solidity ^0.4.0;
// UNSAFE CODE, DO NOT USE!

contract BadFailEarly {

  uint constant DEFAULT_SALARY = 50000;
  mapping(string => uint) nameToSalary;

  function getSalary(string name) constant returns (uint) {
    if (bytes(name).length != 0 && nameToSalary[name] != 0) {
      return nameToSalary[name];
    } else {
      return DEFAULT_SALARY;
    }
  }
}
