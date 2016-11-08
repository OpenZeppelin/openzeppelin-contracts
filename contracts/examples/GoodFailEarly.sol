pragma solidity ^0.4.4;

contract GoodFailEarly {

  uint constant DEFAULT_SALARY = 50000;
  mapping(string => uint) nameToSalary;

  function getSalary(string name) constant returns (uint) {
    if (bytes(name).length == 0) throw;
    if (nameToSalary[name] == 0) throw;

    return nameToSalary[name];
  }
}
