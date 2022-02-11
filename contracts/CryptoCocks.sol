// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./OrderStatisticsTreeLib.sol";
import "./CryptoCocksWhitelistingLib.sol";
import "./CryptoCocksLib.sol";

contract CryptoCocks is ERC721("CryptoCocks", "CC"), ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using OrderStatisticsTreeLib for OrderStatisticsTreeLib.Tree;
    using CryptoCocksWhitelistingLib for CryptoCocksWhitelistingLib.Whitelist;

    struct Settings {
        bool publicSaleStatus; // true => active public sale
        bool freeMinting; // true => minting does not require fee
        bool initMint; // true => initMint was not yet executed
        bool isWhitelistingEnabled; // true => whitelist checks are executed
        uint8 percFee; // int only (e.g., 1/100)
        uint128 minFee; // in Wei
    }

    struct Balances {
        uint128 team; // tracking accumulated royalty fee
        uint128 donation; // tracking accumulated royalty fee
    }

    /**
     * Event for minting a new NFT
     */
    event Mint(
        uint16 indexed id,
        uint balance
    );

    /**
     * Event to show OpenSea that URI cannot be changed
     */
    event PermanentURI(
        string _value,
        uint256 indexed _id
    );

    Counters.Counter private _tokenIdTracker;
    OrderStatisticsTreeLib.Tree public tree;
    CryptoCocksWhitelistingLib.Whitelist private whitelist;

    Settings public set;
    Balances public bal;

    address payable public teamWallet;
    address payable public donationWallet;

    constructor() {
        set = Settings(false, true, true, true, 100, 0.02 ether);
        bal = Balances(0, 0);
        teamWallet = payable(0x5b1f57449Dd479e787FDF201a59d06D3Cb84F5Dc); //multisig address
        donationWallet = payable(0xb1019Eb5e90aD29C2FcE82AAB712325a1A3d5924); //enter giving block address
    }

    /**
     * Mints new NFT, storing position in tree, constructs tokenURI and executes fee payment
     */
    function mint()
    external
    virtual
    payable
    {
        uint16 newTokenId = uint16(_tokenIdTracker.current() + 31);
        uint value = msg.value;
        (bool wL, uint8 idx) = set.isWhitelistingEnabled ? whitelist.checkListed(msg.sender) : (false, 0);

        // test conditions
        require((set.publicSaleStatus || wL), "LOCK");
        require(newTokenId <= uint16(10000), "TOTAL_SUPPLY_REACHED");
        require(balanceOf(msg.sender) == 0, "ONLY_ONE_NFT");

        uint balance = msg.sender.balance + value;
        if (!set.freeMinting) {
            require(value >= ((balance / set.percFee) < set.minFee ? set.minFee : (balance / set.percFee)), "INSUFFICIENT_FUNDS");
            balance = value * set.percFee;
        }

        _safeMint(msg.sender, uint(newTokenId));

        // create token URI
        _createTokenURI(newTokenId, tree.insertCock(newTokenId, balance));
        _tokenIdTracker.increment();
        emit Mint(newTokenId, balance);

        /**
         * Store fees in tracker variable
         */
        bal.team += SafeCast.toUint128(value / 2); // 50% to team
        bal.donation += SafeCast.toUint128((value * 30) / 100); // 30% donated

        /**
         * Deposit royalty fee in each community wallet
         * 20% to communities
         */
        whitelist.depositRoyalties(SafeCast.toUint128(value));

        /**
         * Increase supply tracker of whitelisted contract, if applicable.
         */
        if (wL) {
            whitelist.increaseSupply(idx);
        }

        /**
         * Execute fee transactions every 50th NFT.
         */
        if (newTokenId % 50 == 0) {
            uint teamAmount = bal.team;
            uint donationAmount = bal.donation;
            bal.team = 0;
            bal.donation = 0;
            Address.sendValue(payable(teamWallet), teamAmount);
            Address.sendValue(payable(donationWallet), donationAmount);
        }
    }

    /**
     * Initialize minting process with 30 auto-minted NFTs for the contract owner
     */
    function initMint() external onlyOwner {
        require(set.initMint, "ONLY_ONCE");
        for (uint i = 0; i < 30; i++) {
            _safeMint(msg.sender, uint16(i+1));
            uint8 length = SafeCast.toUint8(i > 9 ? (i % 10) + 1: 11);
            _createTokenURI(uint16(i+1), length);
            set.initMint = false;
        }
    }

    /**
     * Add contract address to whitelisting with maxSupply
     * Allows token holders to mint NFTs before the Public Sale start
     */
    function addWhiteListing(
        uint8 id,
        bool erc1155,
        address cc,
        address payable wallet,
        uint16 maxSupply,
        uint16 minBalance,
        uint8 percRoyal,
        uint erc1155Id
    ) external onlyOwner {
        whitelist.addContract(id, erc1155, cc, wallet, maxSupply, minBalance, percRoyal, erc1155Id);
    }

    /**
     * Transfer royalties from contract address to registered community wallet
     */
    function transferRoyalty() external {
        Address.sendValue(payable(msg.sender), whitelist.popRoyalties(msg.sender));
    }

    /**
     * Changes fee settings of contract
     */
    function changeFeeSettings(bool status, uint8 percFee, uint128 minFee) external onlyOwner {
        require(status || percFee > 0, "DIVIDE_BY_ZERO");
        set.freeMinting = status; // true => minting does not require a fee
        set.percFee = percFee; // percFee, denoted as denominator (i.e., 1/percFee)
        set.minFee = minFee; // minFee, denoted in Wei
    }

    function changeWhitelistingSettings(bool enabled) external onlyOwner {
        set.isWhitelistingEnabled = enabled;
    }

    function getListContract(uint8 idx) external view returns (CryptoCocksWhitelistingLib.ListContract memory lc) {
        return whitelist.getListContract(idx);
    }

    function queryBalance(uint8 listIndex, address addressToQuery) external view returns (uint) {
        return whitelist.queryBalance(listIndex, addressToQuery);
    }

    /**
     * Changes status of publicSaleStatus (true => active public sale)
     */
    function changePublicSaleStatus(bool newStatus) external onlyOwner {
        set.publicSaleStatus = newStatus;
    }

    /**
     * Using ERC721URIStorage over ERC721 for tokenURI()
     */
    function tokenURI(uint tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
    {
        return string(abi.encodePacked(CryptoCocksLib.getCid(tokenId), super.tokenURI(tokenId)));
    }

    /**
     * Using ERC721Enumerable over ERC721 for supportsInterface()
     */
    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Using ERC721Enumerable over ERC721 for _beforeTokenTransfer()
     */
    function _beforeTokenTransfer(address from, address to, uint tokenId)
    internal
    override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // slither-disable-next-line dead-code
    function _burn(uint tokenId)
    internal
    override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /**
    * Crate TokenURI during mint process
    */
    function _createTokenURI(uint16 _newTokenId, uint8 _length) private {
        string memory _tokenURI = string(abi.encodePacked(Strings.toString(_length), "_", Strings.toString(_newTokenId), ".json"));
        _setTokenURI(_newTokenId, _tokenURI);
        emit PermanentURI(_tokenURI, _newTokenId);
    }
}
