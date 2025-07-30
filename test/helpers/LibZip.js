// See: https://github.com/vectorized/solady/blob/main/src/utils/LibZip.sol

/**
 * FastLZ and calldata compression / decompression functions.
 * @namespace
 * @alias module:solady.LibZip
 */
var LibZip = {};

function hexString(data) {
    if (typeof data === "string" || data instanceof String) {
        if (data = data.match(/^[\s\uFEFF\xA0]*(0[Xx])?([0-9A-Fa-f]*)[\s\uFEFF\xA0]*$/)) {
            if (data[2].length % 2) {
                throw new Error("Hex string length must be a multiple of 2.");
            }
            return data[2];
        }
    }
    throw new Error("Data must be a hex string.");
}

function byteToString(b) {
    return (b | 0x100).toString(16).slice(1);
}

function parseByte(data, i) {
    return parseInt(data.substr(i, 2), 16);
}

function hexToBytes(data) {
    var a = [], i = 0;
    for (; i < data.length; i += 2) a.push(parseByte(data, i));
    return a;
}

function bytesToHex(a) {
    var o = "0x", i = 0;
    for (; i < a.length; o += byteToString(a[i++])) ;
    return o;
}

/**
 * Compresses hex encoded data with the FastLZ LZ77 algorithm.
 * @param {string} data A hex encoded string representing the original data.
 * @returns {string} The compressed result as a hex encoded string.
 */
LibZip.flzCompress = function(data) {
    var ib = hexToBytes(hexString(data)), b = ib.length - 4;
    var ht = [], ob = [], a = 0, i = 2, o = 0, j, s, h, d, c, l, r, p, q, e;

    function u24(i) {
        return ib[i] | (ib[++i] << 8) | (ib[++i] << 16);
    }

    function hash(x) {
        return ((2654435769 * x) >> 19) & 8191;
    }

    function literals(r, s) {
        while (r >= 32) for (ob[o++] = 31, j = 32; j--; r--) ob[o++] = ib[s++];
        if (r) for (ob[o++] = r - 1; r--; ) ob[o++] = ib[s++];
    }

    while (i < b - 9) {
        do {
            r = ht[h = hash(s = u24(i))] || 0;
            c = (d = (ht[h] = i) - r) < 8192 ? u24(r) : 0x1000000;
        } while (i < b - 9 && i++ && s != c);
        if (i >= b - 9) break;
        if (--i > a) literals(i - a, a);
        for (l = 0, p = r + 3, q = i + 3, e = b - q; l < e; l++) e *= ib[p + l] === ib[q + l];
        i += l;
        for (--d; l > 262; l -= 262) ob[o++] = 224 + (d >> 8), ob[o++] = 253, ob[o++] = d & 255;
        if (l < 7) ob[o++] = (l << 5) + (d >> 8), ob[o++] = d & 255;
        else ob[o++] = 224 + (d >> 8), ob[o++] = l - 7, ob[o++] = d & 255;
        ht[hash(u24(i))] = i++, ht[hash(u24(i))] = i++, a = i;
    }
    literals(b + 4 - a, a);
    return bytesToHex(ob);
}

/**
 * Decompresses hex encoded data with the FastLZ LZ77 algorithm.
 * @param {string} data A hex encoded string representing the compressed data.
 * @returns {string} The decompressed result as a hex encoded string.
 */
LibZip.flzDecompress = function(data) {
    var ib = hexToBytes(hexString(data)), i = 0, o = 0, l, f, t, r, h, ob = [];
    while (i < ib.length) {
        if (!(t = ib[i] >> 5)) {
            for (l = 1 + ib[i++]; l--;) ob[o++] = ib[i++];
        } else {
            f = 256 * (ib[i] & 31) + ib[i + 2 - (t = t < 7)];
            l = t ? 2 + (ib[i] >> 5) : 9 + ib[i + 1];
            i = i + 3 - t;
            r = o - f - 1;
            while (l--) ob[o++] = ob[r++];
        }
    }
    return bytesToHex(ob);
}

/**
 * Compresses hex encoded calldata.
 * @param {string} data A hex encoded string representing the original data.
 * @returns {string} The compressed result as a hex encoded string.
 */
LibZip.cdCompress = function(data) {
    data = hexString(data);
    var o = "0x", z = 0, y = 0, i = 0, c;

    function pushByte(b) {
        o += byteToString(((o.length < 4 * 2 + 2) * 0xff) ^ b);
    }

    function rle(v, d) {
        pushByte(0x00);
        pushByte(d - 1 + v * 0x80);
    }

    for (; i < data.length; i += 2) {
        c = parseByte(data, i);
        if (!c) {
            if (y) rle(1, y), y = 0;
            if (++z === 0x80) rle(0, 0x80), z = 0;
            continue;
        }
        if (c === 0xff) {
            if (z) rle(0, z), z = 0;
            if (++y === 0x20) rle(1, 0x20), y = 0;
            continue;
        }
        if (y) rle(1, y), y = 0;
        if (z) rle(0, z), z = 0;
        pushByte(c);
    }
    if (y) rle(1, y), y = 0;
    if (z) rle(0, z), z = 0;
    return o;
}

/**
 * Decompresses hex encoded calldata.
 * @param {string} data A hex encoded string representing the compressed data.
 * @returns {string} The decompressed result as a hex encoded string.
 */
LibZip.cdDecompress = function(data) {
    data = hexString(data);
    var o = "0x", i = 0, j, c, s;

    while (i < data.length) {
        c = ((i < 4 * 2) * 0xff) ^ parseByte(data, i);
        i += 2;
        if (!c) {
            c = ((i < 4 * 2) * 0xff) ^ parseByte(data, i);
            s = (c & 0x7f) + 1;
            i += 2;
            for (j = 0; j < s; ++j) o += byteToString((c >> 7 && j < 32) * 0xff);
            continue;
        }
        o += byteToString(c);
    }
    return o;
}

module.exports = LibZip;