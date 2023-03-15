definition nonpayable(env e) returns bool = e.msg.value == 0;

definition max_uint48() returns uint48 = 0xffffffffffff;
