import { ethGetBlock } from './web3';

// Returns the time of the last mined block in seconds
export default async function latestTime () {
  const block = await ethGetBlock('latest');
  return block.timestamp;
}
