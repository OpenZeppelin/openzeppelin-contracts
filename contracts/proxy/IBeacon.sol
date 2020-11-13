pragma solidity ^0.5.0;

interface IBeacon {
  function implementation() external view returns (address);
}