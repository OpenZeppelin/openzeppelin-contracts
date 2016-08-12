contract LimitFunds {

  uint LIMIT = 5000;

  function() { throw; }

  function deposit() {
    if (this.balance > LIMIT) throw;
  }

}
