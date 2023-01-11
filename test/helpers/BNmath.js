function sum (inputs) {
    let acc = web3.utils.toBN(0);
    for (const n of inputs) {
        acc = acc.add(n);
    }
    return acc;
}

module.exports = {
  sum,
};
