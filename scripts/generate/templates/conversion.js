function toBytes32(type, value) {
  switch (type) {
    case 'bytes32':
      return value;
    case 'uint256':
      return `bytes32(${value})`;
    case 'address':
      return `bytes32(uint256(uint160(${value})))`;
    default:
      throw new Error(`Conversion from ${type} to bytes32 not supported`);
  }
}

function fromBytes32(type, value) {
  switch (type) {
    case 'bytes32':
      return value;
    case 'uint256':
      return `uint256(${value})`;
    case 'address':
      return `address(uint160(uint256(${value})))`;
    default:
      throw new Error(`Conversion from bytes32 to ${type} not supported`);
  }
}

module.exports = {
  toBytes32,
  fromBytes32,
};
