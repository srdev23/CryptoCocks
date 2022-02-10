// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface Token {
    function balanceOf(address owner) external view returns (uint balance);
}

interface Token1155 {
    function balanceOf(address owner, uint256 id) external view returns (uint balance);
}

library CryptoCocksWhitelistingLib {
    uint8 private constant MAX_PERC_ROYALTIES = 20;

    struct ListContract {
        bool erc1155;
        uint256 id;
        uint8 percRoyal; // percentage royal fee for each contract
        uint16 maxSupply; // max NFTs for whitelisted owners
        uint16 minBalance; // min balance needed on whitelisted contracts
        uint16 tracker; // tracking number of minted NFTs per whitelisted contract
        uint128 balance;  // tracking accumulated royalty fee
        uint256 erc1155Id; // erc1155 id
        address cc; // community contract addresses
        address wallet; // community wallet addresses
    }

    struct Set {
        // Storage of set values
        ListContract[] _values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping(uint256 => uint256) _indexes; // Unique ListContract Identifier to Index
    }

    struct Whitelist {
        uint8 usedRoyal; // available royal for community wallets (in percentage points)
        Set lists;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(Whitelist storage self, ListContract memory lc) private returns (bool) {
        if (!contains(self, lc.id)) {
            self.lists._values.push(lc);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            self.lists._indexes[lc.id] = self.lists._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(Whitelist storage self, ListContract storage lc) private returns (bool) {
        // We read and store the value's index to prevent multiple reads from the same storage slot
        uint256 valueIndex = self.lists._indexes[lc.id];

        if (valueIndex != 0) {
            // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = self.lists._values.length - 1;

            if (lastIndex != toDeleteIndex) {
                ListContract storage lastvalue = self.lists._values[lastIndex];

                // Move the last value to the index where the value to delete is
                self.lists._values[toDeleteIndex] = lastvalue;
                // Update the index for the moved value
                self.lists._indexes[lastvalue.id] = valueIndex; // Replace lastvalue's index to valueIndex
            }

            // Delete the slot where the moved value was stored
            self.lists._values.pop();

            // Delete the index for the deleted slot
            delete self.lists._indexes[lc.id];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the list contract with an identifier is already in the set. O(1).
     */
    function contains(Whitelist storage self, uint256 id) private view returns (bool) {
        return self.lists._indexes[id] != 0;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(Whitelist storage self) private view returns (uint256) {
        return self.lists._values.length;
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(Whitelist storage self, uint256 index) private view returns (ListContract storage) {
        return self.lists._values[index];
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(Whitelist storage self) private view returns (ListContract[] memory) {
        return self.lists._values;
    }

    /**
     * Check token balance of address on an ERC721, ERC20 or ERC1155 contract
     */
    function queryBalance(Whitelist storage self, uint8 listIndex, address addressToQuery) public view returns (uint) {
        ListContract storage lc = at(self, uint256(listIndex));
        return lc.erc1155 ? Token1155(lc.cc).balanceOf(addressToQuery, lc.erc1155Id) : Token(lc.cc).balanceOf(addressToQuery);
    }

    function increaseSupply(Whitelist storage self, uint8 idx) public {
        ListContract storage lc = at(self, uint256(idx));
        lc.tracker += 1;
    }

    function depositRoyalties(Whitelist storage self, uint128 value) public {
        for (uint256 idx = 0; (idx < length(self)); idx++) {
            ListContract storage lc = at(self, idx);
            lc.balance += uint128((value * lc.percRoyal) / 100);
        }
    }

    function checkListed(Whitelist storage self, address account) external view returns (bool, uint8) {
        for (uint256 i = 0; (i < length(self)); i++) {
            ListContract storage lc = at(self, i);
            if ((queryBalance(self, uint8(i), account) >= lc.minBalance) && (lc.maxSupply > lc.tracker)) {
                return (true, uint8(i));
            }
        }
        return (false, 0);
    }

    /**
     * Add contract address to whitelisting with maxSupply
     * Allows token holders to mint NFTs before the Public Sale start
     */
    function addContract(
        Whitelist storage self,
        bool erc1155,
        address cc,
        address payable wallet,
        uint16 maxSupply,
        uint16 minBalance,
        uint8 percRoyal,
        uint erc1155Id
    ) public {
        require((MAX_PERC_ROYALTIES - self.usedRoyal) >= percRoyal, "FEE_TOO_HIGH");
        add(self, ListContract(erc1155, 1, percRoyal, maxSupply, minBalance, 0, 0, erc1155Id, cc, wallet));
        self.usedRoyal += percRoyal;
    }

    function popRoyalties(Whitelist storage self, address wallet) external returns(uint128 balance) {
        bool isCommunityWallet = false;
        uint256 idx = 0;
        for (uint256 i = 0; (i < length(self)); i++) {
            ListContract storage lc = at(self, i);
            if (lc.wallet == wallet) {
                isCommunityWallet = true;
                idx = i;
                break;
            }
        }
        require(isCommunityWallet, "NO_COMMUNITY_WALLET");
        ListContract storage lcFound = at(self, idx);
        balance = lcFound.balance;
        lcFound.balance = 0;
    }

    function getListContract(Whitelist storage self, uint8 idx) external view returns (ListContract storage lc) {
        return at(self, idx);
    }
}
