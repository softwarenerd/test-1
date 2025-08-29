class LayoutManager {
	private _entryCount: number = 0;
	private _entryMap: number[] = [];
	private _inverseEntryMap = new Map<number, number>();
	private _pinnedIndexes: Set<number> = new Set<number>();

	setEntries(entryCount: number, entryMap: number[] | undefined = undefined) {
		this._entryCount = entryCount;
		this._entryMap = entryMap ?? [];
		this._inverseEntryMap.clear();
		if (this._entryMap.length !== 0) {
			for (let position = 0; position < this._entryMap.length; position++) {
				this._inverseEntryMap.set(this._entryMap[position], position);
			}
		}
	}

	setPinnedIndexes(pinnedIndexes: number[]) {
		this._pinnedIndexes = new Set(pinnedIndexes);
	}



	/**
	 * Maps a position to an index.
	 * @param position The position.
	 * @returns The index, or undefined if the position is invalid.
	 */
	mapPositionToIndex(position: number): number | undefined {
		// If the position is invalid, return undefined.
		if (position < 0 || position >= this._entryCount) {
			return undefined;
		}

		// If there are no pinned indexes, the position is the index.
		if (this._pinnedIndexes.size === 0) {
			// If there is no entry map, the position is the index, so return it.
			if (this._entryMap.length === 0) {
				return position;
			}

			// Return the entry-mapped index. This will naturally return undefined, if the index is invalid.
			return this._entryMap[position];
		}

		// If the position is pinned, return its index.
		if (position < this._pinnedIndexes.size) {
			return Array.from(this._pinnedIndexes)[position];
		}

		// Compute the rank of the position within the unpinned indexes.
		const rank = position - this._pinnedIndexes.size;

		// Compute the number of unpinned positions and validate the rank.
		const unpinnedPositions = this._entryCount - this._pinnedIndexes.size;
		if (rank >= unpinnedPositions) {
			return undefined;
		}

		// Binary search the index.
		let leftPosition = 0;
		let rightPosition = this._entryCount - 1;
		let index = -1;
		let target = rank + 1;
		while (leftPosition <= rightPosition) {
			// Calculate the middle position.
			const middlePosition = (leftPosition + rightPosition) >>> 1;

			// Calculate the number of pinned positions at or before middle position.
			const pinnedPositionsAtOrBeforeMiddlePosition = this.pinnedPositionsAtOrBefore(middlePosition);
			if (pinnedPositionsAtOrBeforeMiddlePosition === undefined) {
				return undefined;
			}

			// Determine whether to search left or right.
			if ((middlePosition + 1) - pinnedPositionsAtOrBeforeMiddlePosition >= target) {
				index = middlePosition;              // This is a candidate entry-map position.
				rightPosition = middlePosition - 1;  // Keep searching left.
			} else {
				leftPosition = middlePosition + 1;   // Keep searching right.
			}
		}

		// Return the index.
		return index === -1 ? undefined : this._entryMap.length !== 0 ? this._entryMap[index] : index;
	}

	/**
	 * Maps an index to a position.
	 * @param index The index to map.
	 * @returns The position, or undefined if the index is invalid.
	 */
	mapIndexToPosition(index: number): number | undefined {
		// If the index is invalid, return undefined.
		if (index < 0) {
			return undefined;
		}

		// If there are no pinned indexes, the index is the position.
		if (this._pinnedIndexes.size === 0) {
			// If there is no entry map, the index is the position, so return it.
			if (this._entryMap.length === 0) {
				// If the index is invalid, return undefined.
				if (index >= this._entryCount) {
					return undefined;
				}

				// Return the index.
				console.log("--tested no pinned indexes and no entry map");
				return index;
			}

			// Return the entry-mapped index. This will naturally return undefined, if the index is invalid.
			console.log("--tested no pinned indexes and entry map");
			return this._entryMap[index];
		}

		// If the index is pinned, return its position.
		if (this._pinnedIndexes.has(index)) {
			return Array.from(this._pinnedIndexes).indexOf(index);
		}

		// Unpinned: must be inside entryCount and in entryMap.
		if (index < 0 || index >= this._entryCount) {
			return undefined;
		}

		// Get the position of the index.
		const position = this.positionOfIndex(index);
		if (position === undefined) {
			return undefined;
		}

		// Calculate the number of pinned positions that occur before this position.
		const pinnedPositionsBefore = position > 0 ? this.pinnedPositionsAtOrBefore(position - 1) : 0;
		if (pinnedPositionsBefore === undefined) {
			return undefined;
		}

		// Return the adjusted position.
		return this._pinnedIndexes.size + (position - pinnedPositionsBefore);
	}

	/**
	 * Returns the position of an index.
	 * @param index The index.
	 * @returns The index of the position.
	 */
	private positionOfIndex(index: number): number | undefined {
		if (this._entryMap.length === 0) {
			return index;
		}

		return this._inverseEntryMap.get(index);
	}

	/**
	 * Returns how many pinned positions are less than or equal to position.
	 * @param position The position.
	 * @returns The count.
	 */
	private pinnedPositionsAtOrBefore(position: number): number | undefined {
		// Count how many pinned positions are less than or equal to position.
		let count = 0;
		for (const pinnedIndex of this._pinnedIndexes) {
			const positionOfIndex = this.positionOfIndex(pinnedIndex);
			if (positionOfIndex === undefined) {
				return undefined;
			}
			if (positionOfIndex <= position) {
				count++;
			}
		}

		// Return the count.
		return count;
	}
}




// TESTING




const testMapPositionToIndex = (layoutManager: LayoutManager, position: number, expectedIndex: number) => {
	const index = layoutManager.mapPositionToIndex(position);
	if (index === expectedIndex) {
		console.log(`SUCCESS position ${position} is index ${index} as expected`);
	} else {
		console.log(` FAILED position ${position} is index ${index} expected ${expectedIndex}`);
	}
};

const testMapIndexToPosition = (layoutManager: LayoutManager, index: number, expectedPosition: number) => {
	const position = layoutManager.mapIndexToPosition(index);
	if (position === expectedPosition) {
		console.log(`SUCCESS index ${index} is position ${position} as expected`);
	} else {
		console.log(` FAILED index ${index} is position ${position} expected ${expectedPosition}`);
	}
};

console.log();
console.log('--------- With no entry map and no pinned indexes');

let layoutManager = new LayoutManager();
layoutManager.setEntries(10);
testMapPositionToIndex(layoutManager, 0, 0);
testMapPositionToIndex(layoutManager, 1, 1);
testMapPositionToIndex(layoutManager, 2, 2);
testMapPositionToIndex(layoutManager, 3, 3);
testMapPositionToIndex(layoutManager, 4, 4);
testMapPositionToIndex(layoutManager, 5, 5);
testMapPositionToIndex(layoutManager, 6, 6);
testMapPositionToIndex(layoutManager, 7, 7);
testMapPositionToIndex(layoutManager, 8, 8);
testMapPositionToIndex(layoutManager, 9, 9);

testMapIndexToPosition(layoutManager, 0, 0);
testMapIndexToPosition(layoutManager, 1, 1);
testMapIndexToPosition(layoutManager, 2, 2);
testMapIndexToPosition(layoutManager, 3, 3);
testMapIndexToPosition(layoutManager, 4, 4);
testMapIndexToPosition(layoutManager, 5, 5);
testMapIndexToPosition(layoutManager, 6, 6);
testMapIndexToPosition(layoutManager, 7, 7);
testMapIndexToPosition(layoutManager, 8, 8);
testMapIndexToPosition(layoutManager, 9, 9);

console.log('--------- With entry map and no pinned indexes');
layoutManager.setEntries(10, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);

testMapPositionToIndex(layoutManager, 0, 9);
testMapPositionToIndex(layoutManager, 1, 8);
testMapPositionToIndex(layoutManager, 2, 7);
testMapPositionToIndex(layoutManager, 3, 6);
testMapPositionToIndex(layoutManager, 4, 5);
testMapPositionToIndex(layoutManager, 5, 4);
testMapPositionToIndex(layoutManager, 6, 3);
testMapPositionToIndex(layoutManager, 7, 2);
testMapPositionToIndex(layoutManager, 8, 1);
testMapPositionToIndex(layoutManager, 9, 0);

testMapIndexToPosition(layoutManager, 9, 0);
testMapIndexToPosition(layoutManager, 8, 1);
testMapIndexToPosition(layoutManager, 7, 2);
testMapIndexToPosition(layoutManager, 6, 3);
testMapIndexToPosition(layoutManager, 5, 4);
testMapIndexToPosition(layoutManager, 4, 5);
testMapIndexToPosition(layoutManager, 3, 6);
testMapIndexToPosition(layoutManager, 2, 7);
testMapIndexToPosition(layoutManager, 1, 8);
testMapIndexToPosition(layoutManager, 0, 9);








console.log()
console.log('--------- With no entry map and pinned indexes');

layoutManager.setEntries(10);
layoutManager.setPinnedIndexes([3, 2, 0]);
testMapPositionToIndex(layoutManager, 0, 3);
testMapPositionToIndex(layoutManager, 1, 2);
testMapPositionToIndex(layoutManager, 2, 0);
testMapPositionToIndex(layoutManager, 3, 1);
testMapPositionToIndex(layoutManager, 4, 4);
testMapPositionToIndex(layoutManager, 5, 5);
testMapPositionToIndex(layoutManager, 6, 6);
testMapPositionToIndex(layoutManager, 7, 7);
testMapPositionToIndex(layoutManager, 8, 8);
testMapPositionToIndex(layoutManager, 9, 9);

testMapIndexToPosition(layoutManager, 0, 2);
testMapIndexToPosition(layoutManager, 1, 3);
testMapIndexToPosition(layoutManager, 2, 1);
testMapIndexToPosition(layoutManager, 3, 0);
testMapIndexToPosition(layoutManager, 4, 4);
testMapIndexToPosition(layoutManager, 5, 5);
testMapIndexToPosition(layoutManager, 6, 6);
testMapIndexToPosition(layoutManager, 7, 7);
testMapIndexToPosition(layoutManager, 8, 8);
testMapIndexToPosition(layoutManager, 9, 9);

console.log();
console.log('--------- With reverse entry map and pinned indexes');

layoutManager.setEntries(10, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
layoutManager.setPinnedIndexes([3, 2, 0]);
testMapPositionToIndex(layoutManager, 0, 3);
testMapPositionToIndex(layoutManager, 1, 2);
testMapPositionToIndex(layoutManager, 2, 0);
testMapPositionToIndex(layoutManager, 3, 9);
testMapPositionToIndex(layoutManager, 4, 8);
testMapPositionToIndex(layoutManager, 5, 7);
testMapPositionToIndex(layoutManager, 6, 6);
testMapPositionToIndex(layoutManager, 7, 5);
testMapPositionToIndex(layoutManager, 8, 4);
testMapPositionToIndex(layoutManager, 9, 1);

testMapIndexToPosition(layoutManager, 3, 0);
testMapIndexToPosition(layoutManager, 2, 1);
testMapIndexToPosition(layoutManager, 0, 2);
testMapIndexToPosition(layoutManager, 9, 3);
testMapIndexToPosition(layoutManager, 8, 4);
testMapIndexToPosition(layoutManager, 7, 5);
testMapIndexToPosition(layoutManager, 6, 6);
testMapIndexToPosition(layoutManager, 5, 7);
testMapIndexToPosition(layoutManager, 4, 8);
testMapIndexToPosition(layoutManager, 1, 9);
