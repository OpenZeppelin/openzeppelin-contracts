import { promisify } from 'es6-promisify';

export const getBalance = promisify(web3.eth.getBalance.bind(web3.eth));
