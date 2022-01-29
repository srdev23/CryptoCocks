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
import "hardhat/console.sol";

contract TokenInterface {
    // solhint-disable-next-line no-empty-blocks
    function balanceOf(address owner) external view returns (uint balance) {}
}

contract CryptoCocks is ERC721("CryptoCocks", "CC"), ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using OrderStatisticsTreeLib for OrderStatisticsTreeLib.Tree;

    struct Settings {
        bool publicSaleStatus; // true => active public sale
        bool freeMinting; // true => minting does not require fee
        uint8 percFee; // int only (e.g., 1/100)
        uint8 availRoyal; // available royal for community wallets (in percentage points)
        uint8 numContracts; // number of whitelisted contracts
        uint8 minLength; // tracking minLength assigned so far
        uint128 minFee; // in Wei
    }

    struct Balances {
        uint128 team; // tracking accumulated royalty fee
        uint128 donation; // tracking accumulated royalty fee
    }

    struct ListContract {
        uint8 percRoyal; // percentage royal fee for each contract
        uint16 maxSupply; // max NFTs for whitelisted owners
        uint16 minBalance; // min balance needed on whitelisted contracts
        uint16 tracker; // tracking number of minted NFTs per whitelisted contract
        uint128 balance;  // tracking accumulated royalty fee
        address cc; // community contract addresses
        address wallet; // community wallet addresses
    }

    /**
     * Event to show OpenSea that URI cannot be changed
     */
    event PermanentURI(
        string _value,
        uint256 indexed _id
    );

    Counters.Counter private _tokenIdTracker;
    OrderStatisticsTreeLib.Tree public tree;

    Settings public set;
    Balances public bal;
    mapping(uint8 => ListContract) public list; // contract mapping that are whitelisted

    address payable public teamWallet;
    address payable public donationWallet;

    constructor() {
        set = Settings(false, true, 100, 20, 0, 10, 0.02 ether);
        bal = Balances(0, 0);
        teamWallet = payable(0xb1eE86786875E110A5c1Ab8cB6BA2ad21994E60e); //multisig address
        donationWallet = payable(0x1ea471c91Ad6cbCFa007FBd6A605522519f9FD64); //enter giving block address
    }

    /**
     * Check balance of address on a another ERC721 contract
     */
    function queryBalance(address tokenAddress, address addressToQuery) public view returns (uint) {
        return TokenInterface(tokenAddress).balanceOf(addressToQuery);
    }

    /**
     * Mints new NFT, storing position in tree, constructs tokenURI and executes fee payment
     */
    function mint()
    external
    virtual
    payable
    {
        (bool wL, uint8 idx) = _checkListed(msg.sender);
        uint16 newTokenId = uint16(_tokenIdTracker.current() + 1);
        uint userBalance = msg.sender.balance + msg.value;

        // test conditions
        require((set.publicSaleStatus || wL), "LOCK");
        require(newTokenId <= uint16(10000), "TOTAL_SUPPLY_REACHED");
        require(balanceOf(msg.sender) == 0, "ONLY_ONE_NFT");

        if (!set.freeMinting) {
            require(msg.value >= ((userBalance / set.percFee) < set.minFee ? set.minFee : (userBalance / set.percFee)), "INSUFFICIENT_FUNDS");
        }

        _safeMint(msg.sender, uint(newTokenId));

        // insert into tree
        if (!tree.exists(userBalance)) {
            tree.insert(newTokenId, userBalance);
        }

        // calculate length
        uint sum = tree.count() - 1;
        uint size = sum > 0 ? ((100 * (tree.rank(userBalance) - 1)) / sum) : 100;

        uint8 length = uint8(((size - (size % 10)) / 10) + 1);
        if (length < set.minLength) {
            length = set.minLength - 1;
            set.minLength = length;
        }

        // create token URI
        _createTokenURI(newTokenId, length);

        /**
         * Store fees in tracker variable
         */
        bal.team += SafeCast.toUint128(msg.value / 2); // 50% to team
        bal.donation += SafeCast.toUint128((msg.value * 30) / 100); // 30% donated

        /**
         * Deposit royalty fee in each community wallet
         */
        _depositRoyaltyFee(msg.value); // 20% to communities

        /**
         * Increase supply tracker of whitelisted contract, if applicable.
         */
        if (wL) {
            list[idx].tracker += 1;
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
        require(_tokenIdTracker.current() < 30, "ONLY_ONCE");
        for (uint i = 0; i < 30; i++) {
            uint16 newTokenId = uint16(_tokenIdTracker.current() + 1);
            _safeMint(msg.sender, newTokenId);
            uint8 length = SafeCast.toUint8(i > 9 ? (i % 10) + 1: 11);
            _createTokenURI(newTokenId, length);
        }
    }

    /**
     * Add contract address to whitelisting with maxSupply
     * Allows token holders to mint NFTs before the Public Sale start
     */
    function addWhiteListing(address cc, address payable wallet, uint16 maxSupply, uint16 minBalance, uint8 percRoyal) external onlyOwner {
        require(set.availRoyal >= percRoyal, "FEE_TOO_HIGH");
        list[set.numContracts] = ListContract(percRoyal, maxSupply, minBalance, 0, 0, cc, wallet);
        set.availRoyal -= percRoyal;
        set.numContracts += 1;
    }

    /**
     * Transfer royalties from contract address to registered community wallet
     */
    function transferRoyalty() external {
        bool isCommunityWallet = false;
        uint8 idx = 0;
        for (uint8 i = 0; i < set.numContracts; i++) {
            if (list[i].wallet == msg.sender) {
                isCommunityWallet = true;
                idx = i;
                break;
            }
        }
        require(isCommunityWallet, "NO_COMMUNITY_WALLET");
        uint amount = list[idx].balance;
        list[idx].balance = 0;
        Address.sendValue(payable(msg.sender), amount);
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
        return super.tokenURI(tokenId);
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
     * Set _baseURI()
     */
    function _baseURI() internal pure override returns (string memory) {
        return "ifps://bafybeicftqysvuqz2aa4ivf3af3usqwt435h6iae7nhompakqy2uh5drye/";
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
     * Checking whether an account holds enough tokens from a whitelisted contract
     * and maxSupply in this contract is not reached yet.
     */
    function _checkListed(address account) private view returns (bool, uint8) {
        for (uint8 i = 0; i < set.numContracts; i++) {
            if ((queryBalance(list[i].cc, account) >= list[i].minBalance) && (list[i].maxSupply > list[i].tracker)) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    /**
    * Deposit royalty fee in each community wallet
    */
    function _depositRoyaltyFee(uint _fee) private {
        for (uint8 i = 0; (i < set.numContracts); i++) {
            list[i].balance += uint128((_fee * list[i].percRoyal) / 100);
        }
    }

    /**
    * Crate TokenURI during mint process
    */
    function _createTokenURI(uint16 _newTokenId, uint8 _length) private {
        string memory _tokenURI = string(abi.encodePacked(Strings.toString(_length), "/", Strings.toString(_newTokenId), "/metadata.json"));
        _setTokenURI(_newTokenId, _tokenURI);
        emit PermanentURI(_tokenURI, _newTokenId);
        _tokenIdTracker.increment();
    }
}
