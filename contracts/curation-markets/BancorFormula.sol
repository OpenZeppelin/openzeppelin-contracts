pragma solidity ^0.4.18;
import "../math/Power.sol";
import "../math/SafeMath.sol";


/**
 * Bancor formula by Bancor
 * https://github.com/bancorprotocol/contracts
 * Modified from the original by Slava Balasanov
 * Split Power.sol out from BancorFormula.sol and replace SafeMath formulas with zeppelin's SafeMath
 * Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements;
 * and to You under the Apache License, Version 2.0. "
 */
contract BancorFormula is Power {
  using SafeMath for uint256;

  string public version = "0.3";
  uint32 private constant MAX_WEIGHT = 1000000;

  /**
    @dev given a token supply, connector balance, weight and a deposit amount (in the connector token),
    calculates the return for a given conversion (in the main token)

    Formula:
    Return = _supply * ((1 + _depositAmount / _connectorBalance) ^ (_connectorWeight / 1000000) - 1)

    @param _supply              token total supply
    @param _connectorBalance    total connector balance
    @param _connectorWeight     connector weight, represented in ppm, 1-1000000
    @param _depositAmount       deposit amount, in connector token

    @return purchase return amount
  */
  function calculatePurchaseReturn(
    uint256 _supply,
    uint256 _connectorBalance,
    uint32 _connectorWeight,
    uint256 _depositAmount) public constant returns (uint256)
  {
    // validate input
    require(_supply > 0 && _connectorBalance > 0 && _connectorWeight > 0 && _connectorWeight <= MAX_WEIGHT);

    // special case for 0 deposit amount
    if (_depositAmount == 0)
      return 0;

    // special case if the weight = 100%
    if (_connectorWeight == MAX_WEIGHT)
      return _supply.mul(_depositAmount).div(_connectorBalance);

    uint256 result;
    uint8 precision;
    uint256 baseN = _depositAmount.add(_connectorBalance);
    (result, precision) = power(
      baseN, _connectorBalance, _connectorWeight, MAX_WEIGHT
    );
    uint256 temp = _supply.mul(result) >> precision;
    return temp - _supply;
  }

  /**
    @dev given a token supply, connector balance, weight and a sell amount (in the main token),
    calculates the return for a given conversion (in the connector token)

    Formula:
    Return = _connectorBalance * (1 - (1 - _sellAmount / _supply) ^ (1 / (_connectorWeight / 1000000)))

    @param _supply              token total supply
    @param _connectorBalance    total connector
    @param _connectorWeight     constant connector Weight, represented in ppm, 1-1000000
    @param _sellAmount          sell amount, in the token itself

    @return sale return amount
  */
  function calculateSaleReturn(
    uint256 _supply,
    uint256 _connectorBalance,
    uint32 _connectorWeight,
    uint256 _sellAmount) public constant returns (uint256)
  {
    // validate input
    require(_supply > 0 && _connectorBalance > 0 && _connectorWeight > 0 && _connectorWeight <= MAX_WEIGHT && _sellAmount <= _supply);

    // special case for 0 sell amount
    if (_sellAmount == 0)
      return 0;

    // special case for selling the entire supply
    if (_sellAmount == _supply)
      return _connectorBalance;

    // special case if the weight = 100%
    if (_connectorWeight == MAX_WEIGHT)
      return _connectorBalance.mul(_sellAmount).div(_supply);

    uint256 result;
    uint8 precision;
    uint256 baseD = _supply - _sellAmount;
    (result, precision) = power(
      _supply, baseD, MAX_WEIGHT, _connectorWeight
    );
    uint256 temp1 = _connectorBalance.mul(result);
    uint256 temp2 = _connectorBalance << precision;
    return temp1.sub(temp2).div(result);
  }
}
