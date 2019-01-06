const expectBNIsWithinDelta = (actualBN, expected, allowableDelta) => {
  const delta = actualBN.minus(expected).abs().toNumber();
  expect(delta).to.be.lt(allowableDelta);
};

module.exports = {
  expectBNIsWithinDelta,
};
