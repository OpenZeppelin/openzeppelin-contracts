function toPromise (func) {
  return (...args) =>
    new Promise((resolve, reject) =>
      func(...args, (error, data) => error ? reject(error) : resolve(data)));
}

module.exports = {
  toPromise,
};
