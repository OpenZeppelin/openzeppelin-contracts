// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (utils/MemoryArray.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of functions for manipulating memory arrays.
 */
library MemoryArray {

    // -------------
    // ||  UINTS  ||
    // -------------
 
    // allows user to push value to memory array 
    function push(uint256[] memory arr, uint256 newVal) public pure returns(uint256[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
   
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ) {

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
     
                }
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint256[] memory arr, uint256 newVal, uint256 index) public pure returns(uint256[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
    
        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint256[] memory arr, uint256 index) public pure returns (uint256[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint256[] memory arr) public pure returns (uint256[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(uint128[] memory arr, uint128 newVal) public pure returns(uint128[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
  
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
     
                }
  
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint128[] memory arr, uint128 newVal, uint256 index) public pure returns(uint128[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
    
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
 
        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint128[] memory arr, uint256 index) public pure returns (uint128[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint128[] memory arr) public pure returns (uint128[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(uint64[] memory arr, uint64 newVal) public pure returns(uint64[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
   
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                          
                }
    
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint64[] memory arr, uint64 newVal, uint256 index) public pure returns(uint64[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
     
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)

            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint64[] memory arr, uint256 index) public pure returns (uint64[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint64[] memory arr) public pure returns (uint64[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(uint32[] memory arr, uint32 newVal) public pure returns(uint32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){   

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                        
                } 
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint32[] memory arr, uint32 newVal, uint256 index) public pure returns(uint32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint32[] memory arr, uint256 index) public pure returns (uint32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint32[] memory arr) public pure returns (uint32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(uint16[] memory arr, uint16 newVal) public pure returns(uint16[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                       
                }
 
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint16[] memory arr, uint16 newVal, uint256 index) public pure returns(uint16[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint16[] memory arr, uint256 index) public pure returns (uint16[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint16[] memory arr) public pure returns (uint16[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(uint8[] memory arr, uint8 newVal) public pure returns(uint8[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
  
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                           
                }
    
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // inserts element into array at index 
    function insert(uint8[] memory arr, uint8 newVal, uint256 index) public pure returns(uint8[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(uint8[] memory arr, uint256 index) public pure returns (uint8[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(uint8[] memory arr) public pure returns (uint8[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // ------------
    // ||  INTS  ||
    // ------------

    // allows user to push value to memory array 
    function push(int256[] memory arr, int256 newVal) public pure returns(int256[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal            
                    
                }
                
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int256[] memory arr, int256 newVal, uint256 index) public pure returns(int256[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // removes element from array at index 
    function remove(int256[] memory arr, uint256 index) public pure returns (int256[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }


    // removes last element from array 
    function pop(int256[] memory arr) public pure returns (int256[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(int128[] memory arr, int128 newVal) public pure returns(int128[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                                      
                }
               
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int128[] memory arr, int128 newVal, uint256 index) public pure returns(int128[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
          
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // removes element from array at index 
    function remove(int128[] memory arr, uint256 index) public pure returns (int128[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(int128[] memory arr) public pure returns (int128[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(int64[] memory arr, int64 newVal) public pure returns(int64[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
          
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal                  
                    
                }               
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int64[] memory arr, int64 newVal, uint256 index) public pure returns(int64[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // removes element from array at index 
    function remove(int64[] memory arr, uint256 index) public pure returns (int64[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(int64[] memory arr) public pure returns (int64[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(int32[] memory arr, int32 newVal) public pure returns(int32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
          
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){              

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                                      
                }              
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int32[] memory arr, int32 newVal, uint256 index) public pure returns(int32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
     
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
    
        }

        return arr;

    }

    // removes element from array at index 
    function remove(int32[] memory arr, uint256 index) public pure returns (int32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(int32[] memory arr) public pure returns (int32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(int16[] memory arr, int16 newVal) public pure returns(int16[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
         
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal                
                    
                }              
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
    
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int16[] memory arr, int16 newVal, uint256 index) public pure returns(int16[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
       
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // removes element from array at index 
    function remove(int16[] memory arr, uint256 index) public pure returns (int16[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(int16[] memory arr) public pure returns (int16[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // allows user to push value to memory array 
    function push(int8[] memory arr, int8 newVal) public pure returns(int8[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
       
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal                 
                    
                }            
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(int8[] memory arr, int8 newVal, uint256 index) public pure returns(int8[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
         
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(int8[] memory arr, uint256 index) public pure returns (int8[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(int8[] memory arr) public pure returns (int8[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // ----------------
    // ||  ADDRESSES ||
    // ----------------

    // allows user to push value to memory array 
    function push(address[] memory arr, address newVal) public pure returns(address[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
       
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal              
                    
                }          
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
    
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(address[] memory arr, address newVal, uint256 index) public pure returns(address[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
          
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
    
        }

        return arr;

    }

    // removes element from array at index 
    function remove(address[] memory arr, uint256 index) public pure returns (address[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(address[] memory arr) public pure returns (address[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // -----------
    // ||  BOOL ||
    // -----------

   // allows user to push value to memory array 
    function push(bool[] memory arr, bool newVal) public pure returns(bool[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
           
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                                      
                }             
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
  
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(bool[] memory arr, bool newVal, uint256 index) public pure returns(bool[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
     
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // removes element from array at index 
    function remove(bool[] memory arr, uint256 index) public pure returns (bool[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(bool[] memory arr) public pure returns (bool[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // ------------
    // ||  BYTES ||
    // ------------

    // allows user to push value to memory array 
    function push(bytes32[] memory arr, bytes32 newVal) public pure returns(bytes32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
        
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            // checks if additional varibales in memory
            if iszero( eq( freeMem, nextMemoryLocation) ){

                let currVal
                let prevVal
                
                // makes room for _newVal by advacning other memory variables locations by 0x20 (32 bytes)
                for { let i := nextMemoryLocation } lt(i, newMsize) { i := add(i, 0x20) } {
                    
                    currVal := mload(i)
                    mstore(i, prevVal)
                    prevVal := currVal
                                    
                }             
            }

            // stores new value to memory
            mstore(nextMemoryLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )
   
        }

        return arr;

    }

    // inserts element into array at index 
    function insert(bytes32[] memory arr, bytes32 newVal, uint256 index) public pure returns(bytes32[] memory) {

        assembly {
    
            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)
    
            // gets next available memory location
            let nextMemoryLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )
       
            let freeMem := mload(0x40)

            // advance msize()
            let newMsize := add( freeMem, 0x20 ) 

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )
            
            let currVal
            let prevVal

            for { let i := targetLocation } lt( i, newMsize ) { i := add( i, 0x20 )} {

                currVal := mload(i)
                mstore(i, prevVal)
                prevVal := currVal

            }

            // stores new value to memory
            mstore(targetLocation, newVal)
    
            // increment length by 1
            length := add( length, 1 )
    
            // store new length value
            mstore( location, length )
    
            // update free memory pointer
            mstore(0x40, newMsize )

        }

        return arr;

    }

    // removes element from array at index 
    function remove(bytes32[] memory arr, uint256 index) public pure returns (bytes32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( index, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }

    // removes last element from array 
    function pop(bytes32[] memory arr) public pure returns (bytes32[] memory){

        assembly {

            // where array is stored in memory 
            let location := arr
    
            // length of array is stored at arr
            let length := mload(arr)

            let freeMemPntr := mload(0x40)

            let targetLocation := add( add( location, 0x20 ), mul( length, 0x20 ) )

            for { let i := targetLocation } lt( i, freeMemPntr ) { i := add( i, 0x20 )} {

                let nextVal := mload( add(i, 0x20 ) )
                mstore(i, nextVal)

            }

            length := sub( length, 1 )

            mstore(location, length)
        }

        return arr;

    }
}