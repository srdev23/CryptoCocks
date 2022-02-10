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
        uint8 percRoyal; // percentage royal fee for each contract
        uint16 maxSupply; // max NFTs for whitelisted owners
        uint16 minBalance; // min balance needed on whitelisted contracts
        uint16 tracker; // tracking number of minted NFTs per whitelisted contract
        uint128 balance;  // tracking accumulated royalty fee
        uint256 id; // erc1155 id
        address cc; // community contract addresses
        address wallet; // community wallet addresses
    }

    struct Whitelist {
        uint8 numContracts; // number of whitelisted contracts
        uint8 usedRoyal; // available royal for community wallets (in percentage points)
        mapping(uint8 => ListContract) lists;
    }

    /**
     * Check token balance of address on an ERC721, ERC20 or ERC1155 contract
     */
    function queryBalance(Whitelist storage self, uint8 listIndex, address addressToQuery) public view returns (uint) {
        return self.lists[listIndex].erc1155 ? Token1155(self.lists[listIndex].cc).balanceOf(addressToQuery, self.lists[listIndex].id) : Token(self.lists[listIndex].cc).balanceOf(addressToQuery);
    }

    function increaseSupply(Whitelist storage self, uint8 idx) public {
        self.lists[idx].tracker += 1;
    }

    function depositRoyalties(Whitelist storage self, uint128 value) public {
        for (uint8 idx = 0; (idx < self.numContracts); idx++) {
            self.lists[idx].balance += uint128((value * self.lists[idx].percRoyal) / 100);
        }
    }

    function checkListed(Whitelist storage self, address account) public view returns (bool, uint8) {
        for (uint8 i = 0; i < self.numContracts; i++) {
            if ((queryBalance(self, i, account) >= self.lists[i].minBalance) && (self.lists[i].maxSupply > self.lists[i].tracker)) {
                return (true, i);
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
        self.lists[self.numContracts] = ListContract(erc1155, percRoyal, maxSupply, minBalance, 0, 0, erc1155Id, cc, wallet);
        self.usedRoyal += percRoyal;
        self.numContracts += 1;
    }

    function popRoyalties(Whitelist storage self, address wallet) public returns(uint128 balance) {
        bool isCommunityWallet = false;
        uint8 idx = 0;
        for (uint8 i = 0; i < self.numContracts; i++) {
            if (self.lists[i].wallet == wallet) {
                isCommunityWallet = true;
                idx = i;
                break;
            }
        }
        require(isCommunityWallet, "NO_COMMUNITY_WALLET");
        balance = self.lists[idx].balance;
        self.lists[idx].balance = 0;
    }

    function getListContract(Whitelist storage self, uint8 idx) public view returns (ListContract storage lc) {
        return self.lists[idx];
    }
}
