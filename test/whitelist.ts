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
  assertBalanceOf,
  CommunityTokenHolders,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

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

  describe("Add Contracts", function () {
    it("should be possible to add a whitelisted contract", async () => {
      const percRoyal = 10;
      const maxSupply = 2;
      const minBalance = 100;
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;

      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        testToken,
        communityWallet,
        maxSupply,
        minBalance,
        percRoyal
      );
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
          .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
      ).to.be.reverted;
    });

    it("should be able to add whitelisted contracts with royalty percentages up to 20% in sum", async () => {
      const percRoyals = [8, 6, 3, 2, 1];
      const communityWallet = signer1;
      const testToken = contracts.testTokenOne;

      for (const percRoyal of percRoyals) {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          testToken,
          communityWallet,
          2,
          100,
          percRoyal
        );
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
          testToken,
          communityWallet,
          2,
          100,
          percRoyal,
          expectRevert
        );
      }
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

    it("should be possible to receive balance of CCKN tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.kryptonauten,
        COMMUNITY_TOKEN_HOLDERS.kryptonauten
      );
    });

    it("should be possible to receive balance of DDIM tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.duckdao,
        COMMUNITY_TOKEN_HOLDERS.duckdao
      );
    });

    it("should be possible to receive balance of LOBS tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.lobsterdao,
        COMMUNITY_TOKEN_HOLDERS.lobsterdao
      );
    });

    it("should be possible to receive balance of KONGZ tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.cyberkongz,
        COMMUNITY_TOKEN_HOLDERS.cyberkongz
      );
    });

    it("should be possible to receive balance of DAO tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.daomaker,
        COMMUNITY_TOKEN_HOLDERS.daomaker
      );
    });

    it("should be possible to receive balance of NTCTZN tokens", async () => {
      await assertBalanceOf(
        contracts.cryptoCocks,
        COMMUNITY_CONTRACTS.neotokyo,
        COMMUNITY_TOKEN_HOLDERS.neotokyo
      );
    });
  });
});
