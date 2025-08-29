"use strict";
class LayoutManager {
    constructor() {
        this._entryCount = 0;
        this._pinnedIndexes = new Set();
    }
    setEntries(entryCount, entryMap = undefined) {
        this._entryCount = entryCount;
        this._entryMap = entryMap;
    }
    setPinnedIndexes(pinnedIndexes) {
        this._pinnedIndexes = new Set(pinnedIndexes);
    }
    /**
     * Maps position to index.
     * @param position The position to map.
     * @returns The index, or undefined if the position is invalid.
     */
    mapPositionToIndex(position) {
        // If the position is negative, it's invalid.
        if (position < 0) {
            return undefined;
        }
        // If the position is within the pinned indexes, return it.
        if (position < this._pinnedIndexes.size) {
            return Array.from(this._pinnedIndexes)[position];
        }
        // Calculate the unpinned indexes count.
        const unpinnedIndexesCount = this._entryCount - this._pinnedIndexes.size;
        // After pinned block: find the (position - m)-th unpinned index.
        const n = position - this._pinnedIndexes.size; // 0-based among unpinned
        if (n >= unpinnedIndexesCount) {
            return undefined;
        }
        const sortedPinnedIndexes = Array.from(this._pinnedIndexes).sort((a, b) => a - b);
        // Binary search the smallest x with unpinnedCountUpTo(x) >= n+1
        // where unpinnedCountUpTo(x) = (x + 1) - countPinnedLE(x).
        let low = 0;
        let high = this._entryCount - 1;
        const target = n + 1;
        while (low < high) {
            const middle = (low + high) >> 1;
            const unpinnedUpTo = (middle + 1) - this.countPinnedLE(middle, sortedPinnedIndexes);
            if (unpinnedUpTo >= target) {
                high = middle;
            }
            else {
                low = middle + 1;
            }
        }
        // lo is the first index reaching the target unpinned count; it will be unpinned.
        return low;
    }
    mapIndexToPosition(index) {
        if (this._pinnedIndexes.has(index)) {
            return Array.from(this._pinnedIndexes).indexOf(index);
        }
        // Case 2: index is unpinned
        const sortedPinnedIndexes = Array.from(this._pinnedIndexes).sort((a, b) => a - b);
        // Count how many pinned indexes are less than this index
        let lo = 0, hi = sortedPinnedIndexes.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (sortedPinnedIndexes[mid] < index)
                lo = mid + 1;
            else
                hi = mid;
        }
        const numPinnedBefore = lo;
        // Position = pinned block size + number of unpinned < index
        return sortedPinnedIndexes.length + (index - numPinnedBefore);
    }
    countPinnedLE(x, sorted) {
        let low = 0;
        let high = sorted.length;
        while (low < high) {
            const middle = (low + high) >> 1;
            if (sorted[middle] <= x) {
                low = middle + 1;
            }
            else {
                high = middle;
            }
        }
        return low;
    }
}
const testMapPositionToIndex = (layoutManager, position, expectedIndex) => {
    const index = layoutManager.mapPositionToIndex(position);
    if (index === expectedIndex) {
        console.log(`SUCCESS position ${position} is index ${index} as expected`);
    }
    else {
        console.log(` FAILED position ${position} is index ${index} expected ${expectedIndex}`);
    }
};
const testMapIndexToPosition = (layoutManager, index, expectedPosition) => {
    const position = layoutManager.mapIndexToPosition(index);
    if (position === expectedPosition) {
        console.log(`SUCCESS index ${index} is position ${position} as expected`);
    }
    else {
        console.log(` FAILED index ${index} is position ${position} expected ${expectedPosition}`);
    }
};
let layoutManager = new LayoutManager();
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
