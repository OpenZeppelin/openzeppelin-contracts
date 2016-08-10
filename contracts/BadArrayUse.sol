import './PullPaymentCapable.sol';

// UNSAFE CODE, DO NOT USE!

contract BadArrayUse is PullPaymentCapable {
  address[] employees;

  function payroll() {
    for (var i = 0; i < employees.length; i++) {
      
    }
      
  }
}
