import { sha3 } from "ethereumjs-util";

export default class MerkleTree {
  constructor(elements) {
    // Filter empty strings
    this.elements = elements.filter(el => el);

    // Check if elements are 32 byte buffers
    if (this.elements.some(el => el.length !== 32 || !Buffer.isBuffer(el))) {
      throw new Error("Elements must be 32 byte buffers");
    }

    // Deduplicate elements
    this.elements = this.bufDedup(this.elements);
    // Sort elements
    this.elements.sort(Buffer.compare);

    // Create layers
    this.layers = this.getLayers(this.elements);
  }

  getLayers(elements) {
    if (elements.length == 0) {
      return [[""]];
    }

    const layers = [];
    layers.push(elements);

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  getNextLayer(elements) {
    return elements.reduce((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(this.combinedHash(el, arr[idx + 1]));
      }

      return layer;
    }, []);
  }

  combinedHash(first, second) {
    if (!first) { return second; }
    if (!second) { return first; }

    return sha3(this.sortAndConcat(first, second));
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getHexRoot() {
    return this.bufToHex(this.getRoot());
  }

  getProof(el) {
    let idx = this.bufIndexOf(el, this.elements);

    if (idx === -1) {
      throw new Error("Element does not exist in Merkle tree");
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = this.getPairElement(idx, layer);

      if (pairElement) {
        proof.push(pairElement);
      }

      idx = Math.floor(idx / 2);

      return proof;
    }, []);
  }

  getHexProof(el) {
    const proof = this.getProof(el);

    return this.bufArrToHex(proof);
  }

  getPairElement(idx, layer) {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    } else {
      return null;
    }
  }

  bufIndexOf(el, arr) {
    for (let i = 0; i < arr.length; i++) {
      if (el.equals(arr[i])) {
        return i;
      }
    }

    return -1;
  }

  bufDedup(elements) {
    return elements.filter((el, idx) => {
      return this.bufIndexOf(el, elements) === idx;
    });
  }

  bufToHex(el) {
    if (!Buffer.isBuffer(el)) {
      throw new Error("Element is not a buffer");
    }

    return "0x" + el.toString("hex");
  }

  bufArrToHex(arr) {
    if (arr.some(el => !Buffer.isBuffer(el))) {
      throw new Error("Array is not an array of buffers");
    }

    return "0x" + arr.map(el => el.toString("hex")).join("");
  }

  sortAndConcat(...args) {
    return Buffer.concat([...args].sort(Buffer.compare));
  }
}
