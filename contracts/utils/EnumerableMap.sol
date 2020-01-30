library EnumerableMap {
	struct Entry {
		address key;
		uint8 value;
	}

	struct Map {
		mapping (address => uint256) index;
		Entry[] entries;
	}

	// we initialize it with a placeholder item in the first position because we treat the array as 1-indexed since 0 is a special index (means no entry in the index)
	function initialize(Map storage map) internal {
		map.entries.push();
	}

	function contains(Map storage map, address key) internal view returns (bool) {
		return map.index[key] != 0;
	}

	function add(Map storage map, address key, uint8 value) internal {
		uint256 index = map.index[key];
		if (index == 0) {
			// create new entry
			Entry memory entry = Entry({ key: key, value: value });
			uint256 newEntryIndex = map.entries.length;
			map.entries.push(entry);
			map.index[key] = newEntryIndex;
		} else {
			// update existing entry
			map.entries[map.index[key]].value = value;
		}

		require(map.entries[map.index[key]].key == key, "Key at inserted location does not match inserted key.");
		require(map.entries[map.index[key]].value == value, "Value at inserted location does not match inserted value.");
	}

	function remove(Map storage map, address key) internal {
		// get the index into entries array that this entry lives at
		uint256 index = map.index[key];

		// if this key doesn't exist in the index, then we have nothing to do
		if (index == 0) return;

		// if the entry we are removing isn't the last, overwrite it with the last entry
		uint256 lastIndex = map.entries.length - 1;
		if (index != lastIndex) {
			Entry storage lastEntry = map.entries[lastIndex];
			map.entries[index] = lastEntry;
			map.index[lastEntry.key] = index;
		}

		// delete the last entry (if the item we are removing isn't last, it will have been overwritten inside the conditional above)
		map.entries.pop();

		// delete the index pointer
		delete map.index[key];

		require(map.index[key] == 0, "Removed key still exists in the index.");
		require(map.entries[index].key != key, "Removed key still exists in the array at original index.");
	}

	function get(Map storage map, address key) internal view returns (uint8) {
		return map.entries[map.index[key]].value;
	}

	function enumerate(Map storage map) internal view returns (Entry[] memory) {
		Entry[] memory output = new Entry[](map.entries.length - 1);

		for (uint256 i = 1; i < map.entries.length; ++i) {
			output[i - 1] = map.entries[i];
		}
		return output;
	}
}
