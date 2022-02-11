import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import {
  Contracts,
  deploy,
  // eslint-disable-next-line node/no-missing-import
} from "./deploy";
import {
  addWhitelistedContract,
  addWhitelistedERC1155Contract,
  assertBalanceOf,
  CommunityTokenHolders,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("Whitelist", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress,
    nonOwner: SignerWithAddress,
    signer1: SignerWithAddress;

  beforeEach(async () => {
    [owner, signer1] = await ethers.getSigners();
    nonOwner = signer1;
    contracts = await deploy(owner);
  });

  it("should revert when trying to get a contract that does not exist", async () => {
    const tx = contracts.cryptoCocks.getListContract(0);
    await expect(tx).to.be.revertedWith("LC_NOT_FOUND");
  });

  describe("Add Contracts", function () {
    it("should be possible to add a whitelisted contract", async () => {
      const percRoyal = 10;
      const maxSupply = 2;
      const minBalance = 100;
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;
      const id = 0;

      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        testToken.address,
        id,
        communityWallet,
        maxSupply,
        minBalance,
        percRoyal
      );

      const tx = contracts.cryptoCocks.getListContract(0);
      await expect(tx).to.not.be.reverted;
    });

    it("should be possible to add a whitelisted contract by owner only", async () => {
      const percRoyal = 10;
      const maxSupply = 2;
      const minBalance = 100;
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;
      const cc = testToken.address;
      const wallet = communityWallet.address;

      await expect(
        contracts.cryptoCocks
          .connect(nonOwner)
          .addWhiteListing(
            0,
            false,
            cc,
            wallet,
            maxSupply,
            minBalance,
            percRoyal,
            0
          )
      ).to.be.reverted;
    });

    it("should be able to add whitelisted contracts with royalty percentages up to 20% in sum", async () => {
      const percRoyals = [8, 6, 3, 2, 1];
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;

      let index = 0;
      for (const percRoyal of percRoyals) {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          testToken.address,
          index,
          communityWallet,
          2,
          100,
          percRoyal
        );
        index++;
      }
    });

    it("should not be able to add whitelisted contracts with royalty percentages more than 20% in sum", async () => {
      const percRoyals = [8, 6, 4, 1, 2]; // 21% (last transaction should fail)
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;

      for (const percRoyal of percRoyals) {
        // last transaction should fail
        const index = percRoyals.indexOf(percRoyal);
        let expectRevert = false;
        if (index === percRoyals.length - 1) {
          expectRevert = true;
        }

        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          testToken.address,
          index,
          communityWallet,
          2,
          100,
          percRoyal,
          expectRevert
        );
      }
    });
  });

  describe("Remove Contracts", function () {
    const listContractId = 0;

    beforeEach(async () => {
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;

      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        testToken.address,
        listContractId,
        communityWallet,
        2,
        100,
        10
      );
    });
  });

  describe("Query Balance", function () {
    const COMMUNITY_CONTRACTS = {
      kryptonauten: "0x5501f260c398b613f57c4c6be55fef41bd397c28",
      duckdao: "0xfbeea1c75e4c4465cb2fccc9c6d6afe984558e20",
      lobsterdao: "0x026224a2940bfe258d0dbe947919b62fe321f042",
      cyberkongz: "0x57a204AA1042f6E66DD7730813f4024114d74f37",
      daomaker: "0x0f51bb10119727a7e5eA3538074fb341F56B09Ad",
      neotokyo: "0xb668beB1Fa440F6cF2Da0399f8C28caB993Bdd65",
    };

    const COMMUNITY_TOKEN_HOLDERS: CommunityTokenHolders = {
      kryptonauten: {
        address: "0x2755D9661081e82e125343A802C47cE5574ADfa5",
        balance: "1",
      },
      duckdao: {
        address: "0x229cbd1955fee93ab6e7876c1b17f6d0b859e953",
        balance: "246369320000000000000000",
      },
      lobsterdao: {
        address: "0x76778d62b680b64bf18632ae14af8411ce142ace",
        balance: "1",
      },
      cyberkongz: {
        address: "0x9279c4cfb0e85e2dff8825ce141f9794c7c7170a",
        balance: "63",
      },
      daomaker: {
        address: "0x3303ba184b5bca54bb519067b658261fd4142abe",
        balance: "34460450466670000000000",
      },
      neotokyo: {
        address: "0xbc2ff4a129dbd2063c2760713b801cbea639bd23",
        balance: "1",
      },
    };

    const MAX_SUPPLY = {
      kryptonauten: 400,
      duckdao: 250,
      lobsterdao: 150,
      cyberkongz: 100,
      daomaker: 50,
      neotokyo: 20,
    };

    const MIN_BALANCE = {
      kryptonauten: 1,
      duckdao: 100,
      lobsterdao: 1,
      cyberkongz: 5,
      daomaker: 300,
      neotokyo: 1,
    };

    const PERC_ROYAL = {
      kryptonauten: 10,
      duckdao: 5,
      lobsterdao: 3,
      cyberkongz: 2,
      daomaker: 0,
      neotokyo: 0,
    };

    beforeEach(async () => {
      // Krymptonauten
      await addWhitelistedERC1155Contract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.kryptonauten,
        0,
        BigNumber.from(
          "0x043dd28dedaf4209e7aa7ed460e2a45e0915b7eb000000000000000000000001"
        ),
        signer1,
        MAX_SUPPLY.kryptonauten,
        MIN_BALANCE.kryptonauten,
        PERC_ROYAL.kryptonauten
      );

      // Duck DAO
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.duckdao,
        1,
        signer1,
        MAX_SUPPLY.duckdao,
        MIN_BALANCE.duckdao,
        PERC_ROYAL.duckdao
      );

      // Lobster DAO
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.lobsterdao,
        2,
        signer1,
        MAX_SUPPLY.lobsterdao,
        MIN_BALANCE.lobsterdao,
        PERC_ROYAL.lobsterdao
      );

      // CyberKongz
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.cyberkongz,
        3,
        signer1,
        MAX_SUPPLY.cyberkongz,
        MIN_BALANCE.cyberkongz,
        PERC_ROYAL.cyberkongz
      );

      // DAO Maker
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.daomaker,
        4,
        signer1,
        MAX_SUPPLY.daomaker,
        MIN_BALANCE.daomaker,
        PERC_ROYAL.daomaker
      );

      // NeoTokyo
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        COMMUNITY_CONTRACTS.neotokyo,
        5,
        signer1,
        MAX_SUPPLY.neotokyo,
        MIN_BALANCE.neotokyo,
        PERC_ROYAL.neotokyo
      );
    });

    it("should be possible to receive balance of CCKN tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        0,
        COMMUNITY_TOKEN_HOLDERS.kryptonauten
      );
    });

    it("should be possible to receive balance of DDIM tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        1,
        COMMUNITY_TOKEN_HOLDERS.duckdao
      );
    });

    it("should be possible to receive balance of LOBS tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        2,
        COMMUNITY_TOKEN_HOLDERS.lobsterdao
      );
    });

    it("should be possible to receive balance of KONGZ tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        3,
        COMMUNITY_TOKEN_HOLDERS.cyberkongz
      );
    });

    it("should be possible to receive balance of DAO tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        4,
        COMMUNITY_TOKEN_HOLDERS.daomaker
      );
    });

    it("should be possible to receive balance of NTCTZN tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        5,
        COMMUNITY_TOKEN_HOLDERS.neotokyo
      );
    });
  });
});
