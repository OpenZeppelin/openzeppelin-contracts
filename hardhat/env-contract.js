extendEnvironment(env => {
  const { contract } = env;

  env.contract = function (name, body) {
    // remove the default account from the accounts list used in tests, in order
    // to protect tests against accidentally passing due to the contract
    // deployer being used subsequently as function caller
    contract(name, accounts => body(accounts.slice(1)));
  };
});
