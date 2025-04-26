// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EnumerableSet} from "./EnumerableSet.sol";

/**
 * @title AdjacencyListGraph
 * @dev Library for managing an undirected graph structure represented using adjacency lists.
 * Nodes are identified by uint256. Edges are stored using EnumerableSet for efficient neighbor enumeration.
 * Note: This basic implementation assumes an undirected graph where adding/removing an edge (A, B)
 * also implicitly adds/removes edge (B, A). Does not explicitly track node existence; nodes exist implicitly
 * when they have edges. Be mindful of gas costs for adding/removing edges due to storage modifications.
 */
library AdjacencyListGraph {
    using EnumerableSet for EnumerableSet.UintSet;

    struct Graph {
        // Mapping from node ID to a set of its neighbors
        mapping(uint256 => EnumerableSet.UintSet) _adjacencyList;
    }

    /**
     * @dev Adds an undirected edge between `from` and `to`.
     * Adds `to` to `from`'s neighbor set and `from` to `to`'s neighbor set.
     * Returns true if the edge was added, false if it already existed.
     */
    function addEdge(Graph storage graph, uint256 from, uint256 to) internal returns (bool) {
        // Add both directions for undirected graph
        bool addedForward = graph._adjacencyList[from].add(to);
        bool addedBackward = graph._adjacencyList[to].add(from);
        // Return true only if it was newly added in the primary direction specified
        return addedForward;
    }

    /**
     * @dev Removes an undirected edge between `from` and `to`.
     * Removes `to` from `from`'s neighbor set and `from` from `to`'s neighbor set.
     * Returns true if the edge was removed, false if it did not exist.
     */
    function removeEdge(Graph storage graph, uint256 from, uint256 to) internal returns (bool) {
        // Remove both directions for undirected graph
        bool removedForward = graph._adjacencyList[from].remove(to);
        graph._adjacencyList[to].remove(from);
        // Return true only if it was removed in the primary direction specified
        return removedForward;
    }

    /**
     * @dev Returns the neighbors of a given `node`.
     */
    function getNeighbors(Graph storage graph, uint256 node) internal view returns (uint256[] memory) {
        return graph._adjacencyList[node].values();
    }

    /**
     * @dev Checks if an edge exists between `from` and `to`.
     * Since it's undirected, checking one direction is sufficient.
     */
    function hasEdge(Graph storage graph, uint256 from, uint256 to) internal view returns (bool) {
        return graph._adjacencyList[from].contains(to);
    }

    /**
     * @dev Returns the number of neighbors (degree) of a `node`.
     */
    function countNeighbors(Graph storage graph, uint256 node) internal view returns (uint256) {
        return graph._adjacencyList[node].length();
    }
} 