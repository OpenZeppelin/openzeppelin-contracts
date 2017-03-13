pragma solidity ^0.4.8;

contract Will is Ownable {

   uint256 timeBeforeRelease; //Time in seconds remaining for the relase to the heirs
   uint256 lastPingTime; //Last time the owner interacted with the contract
   address[] heirAddress;


   //The weight of a heir changes how much of the funds he deserves. If all
   //heirs have a weitgh of 1(defualt value) the funds are shared equally between
   //all of them. If on heir has a weight of 2 and the other has a weight of 1, the
   //first one gets 2/3 of the funds while the other gets 1/3.
   mapping(address => uint256) heirs;


   Will(uint256 _timeBeforeRelease) Onwable(){
      timeBeforeRelease = _timeBeforeRelease;
      lastPingTime = now;
   }

   function ping() onlyOwner {
      _;
   }

   function getHeirWeigth(address heir) constant returns(uint256){
      return heirs[heir];
   }

   function getHeirsAddress(uint _index) constant returns(address){
      return heirAddress[_index];
   }

   function getHeirCount() constant returns(uint){
      returns heirAddress.length;
   }

   function addHeir(address heir, uint256 weight) onlyOwner{
      if (heirs[heir] != 0) throw;
      heirs[heir] = weight;
      heirAddress.push(heir);
   }

   function changeHeirWeight(address _heir, uint256 weitgh) onlyOwner{

   }

   //Quite expensive operation, but hopefully I won't be needed much in a lifetime ;)
   function removeHeir(address heir) onlyOwner{
      heirs[heir] = 0;
      for(uint i = 0; i < getHeirCount(); i++){
         if(getHeirsAddress(i) == heir){
            //copy the last address into the 'deleted spot', so there won't be a gap in the array.
            heirAddress[i] = getHeirsAddress(getHeirCount() - 1);
            delete heirAddress[getHeirsAddress(getHeirCount() - 1)];
         }
      }
   }

   function changeMaximumPingInterval(uint256 _seconds) onlyOwner {
      timeBeforeRelease = _seconds;
   }

   modifier onlyOwner() {
     if (msg.sender != owner) {
       throw;
     }
     _;
     lastPingTime = now;
   }

   function claim() {
      if (lastPingTime < timeBeforeRelease) throw;
      //get sum of weigths
      uint memory total = 0;
      uint memory balance = this.balance
      for(uint i =0; i < getHeirCount(); i++){
         total += heirs[getHeirsAddress(i)];
      }
      //release fund to heirs
      for(uint i =0; i < getHeirCount(); i++){
         getHeirsAddress(i).transfer((heirs[getHeirsAddress(i)] / total) * balance)
      }
   }
}
