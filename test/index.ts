import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks, TestTokenOne, TestTokenTwo } from "../typechain";
// eslint-disable-next-line node/no-missing-import
import config from "../hardhat.config";
import {
  deployContracts,
  deployTestTokens,
  loadPercentileData,
  PercentileDataEntry,
  setContractToFreeSale,
  setContractToPrivateSale,
  setContractToPublicSale,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";

const CONFIG_ACCOUNT_COUNT = JSON.parse(
  JSON.stringify(config.networks?.hardhat?.accounts)
).length;
const TEAM_WALLET = "0xb1eE86786875E110A5c1Ab8cB6BA2ad21994E60e";
const DONATION_WALLET = "0x1ea471c91Ad6cbCFa007FBd6A605522519f9FD64";
const INIT_MINT_COUNT = 30;

interface Contracts {
  cryptoCocks: CryptoCocks;
  testTokenOne: TestTokenOne;
  testTokenTwo: TestTokenTwo;
}

/*
███████╗███████╗████████╗██╗   ██╗██████╗ 
██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
███████╗█████╗     ██║   ██║   ██║██████╔╝
╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ 
███████║███████╗   ██║   ╚██████╔╝██║     
╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝                                                                                                                                                                                                                                                                                                                                                                                  
*/

describe("CryptoCocks", function () {
  const contracts = {} as Contracts;
  const accounts: { [key: string]: SignerWithAddress } = {};
  let signers: SignerWithAddress[];

  let percentileData: PercentileDataEntry[];
  let tokenCounter = 0;
  let feesWhiteListed = BigNumber.from("0");

  before(async () => {
    signers = await ethers.getSigners();
    percentileData = await loadPercentileData();
    await deploy();
  });

  /**
   * Deploys the OrderStatisticsTreeLib and CryptoCocks contract.
   * Also links the library and the CryptoCocks contract.
   */
  async function deploy() {
    // deploy contracts
    const deployed = await deployContracts();
    const deployedTestContracts = await deployTestTokens();

    // set accounts
    accounts.owner = deployed.owner;
    accounts.nonOwner = deployed.nonOwner;

    // set contracts
    contracts.cryptoCocks = deployed.cryptoCocks;
    contracts.testTokenOne = deployedTestContracts.testTokenOne;
    contracts.testTokenTwo = deployedTestContracts.testTokenTwo;

    // non-minters
    const [communityWallet1, communityWallet2] = signers.slice(1, 3);
    accounts.communityWallet1 = communityWallet1;
    accounts.communityWallet2 = communityWallet2;

    const [signerTokenOneBelow, signerTokenTwoBelow, signerTokenOneAbove3] =
      signers.slice(3, 6);
    accounts.signerTokenOneBelow = signerTokenOneBelow;
    accounts.signerTokenTwoBelow = signerTokenTwoBelow;
    accounts.signerTokenOneAbove3 = signerTokenOneAbove3;

    // minters
    const [
      signerTokenOneAbove1,
      signerTokenOneAbove2,
      signerTokenTwoAbove,
      signerTokenBothAbove,
    ] = signers.slice(6, 10);
    accounts.signerTokenOneAbove1 = signerTokenOneAbove1;
    accounts.signerTokenOneAbove2 = signerTokenOneAbove2;
    accounts.signerTokenTwoAbove = signerTokenTwoAbove;
    accounts.signerTokenBothAbove = signerTokenBothAbove;

    accounts.freeSigner = signers[10];
    signers = signers.slice(11);

    // mint signerTokenOneBelow + signerTokenTwoBelow
    for (let i = 0; i < 99; i++) {
      await contracts.testTokenOne
        .connect(accounts.signerTokenOneBelow)
        .mint(accounts.signerTokenOneBelow.address);
      await contracts.testTokenTwo
        .connect(signerTokenTwoBelow)
        .mint(signerTokenTwoBelow.address);
    }

    // mint signerTokenOneAbove1 + signerTokenBothAbove + signerTokenTwoAbove
    for (let i = 0; i < 100; i++) {
      await contracts.testTokenOne
        .connect(signerTokenOneAbove1)
        .mint(signerTokenOneAbove1.address);
      await contracts.testTokenOne
        .connect(signerTokenBothAbove)
        .mint(signerTokenBothAbove.address);
      await contracts.testTokenTwo
        .connect(signerTokenTwoAbove)
        .mint(signerTokenTwoAbove.address);
      await contracts.testTokenTwo
        .connect(signerTokenBothAbove)
        .mint(signerTokenBothAbove.address);
    }

    // mint signerTokenOneAbove3
    for (let i = 0; i < 150; i++) {
      await contracts.testTokenOne
        .connect(signerTokenOneAbove2)
        .mint(signerTokenOneAbove2.address);
    }

    // mint signerTokenOneAbove3
    for (let i = 0; i < 300; i++) {
      await contracts.testTokenOne
        .connect(signerTokenOneAbove3)
        .mint(signerTokenOneAbove3.address);
    }

    // Adjust balances for used gas cost
    const signerToBeAdjusted = [
      signerTokenOneAbove1,
      signerTokenOneAbove2,
      signerTokenTwoAbove,
      signerTokenBothAbove,
    ];
    let idx = 0;

    for (const signer of signerToBeAdjusted) {
      const balance = await signerToBeAdjusted[idx].getBalance();
      const balanceToBe = ethers.utils.parseEther(percentileData[idx].balance);
      const tx = accounts.owner.sendTransaction({
        to: await signer.getAddress(),
        value: balanceToBe.sub(balance),
      });
      (await tx).wait();
      idx++;
    }
  }

  /*
 ████████╗███████╗███████╗████████╗    ██╗    ██╗██╗  ██╗██╗████████╗███████╗    ██╗     ██╗███████╗████████╗██╗███╗   ██╗ ██████╗
 ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ██║    ██║██║  ██║██║╚══██╔══╝██╔════╝    ██║     ██║██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝
    ██║   █████╗  ███████╗   ██║       ██║ █╗ ██║███████║██║   ██║   █████╗      ██║     ██║███████╗   ██║   ██║██╔██╗ ██║██║  ███╗
    ██║   ██╔══╝  ╚════██║   ██║       ██║███╗██║██╔══██║██║   ██║   ██╔══╝      ██║     ██║╚════██║   ██║   ██║██║╚██╗██║██║   ██║
    ██║   ███████╗███████║   ██║       ╚███╔███╔╝██║  ██║██║   ██║   ███████╗    ███████╗██║███████║   ██║   ██║██║ ╚████║╚██████╔╝
    ╚═╝   ╚══════╝╚══════╝   ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
  */

  it("should be possible to add a white listing contract by owner only", async () => {
    const cc = contracts.testTokenOne.address;
    const wallet = accounts.communityWallet1.address;
    const maxSupply = 2;
    const minBalance = 100;
    const percRoyal = 10;

    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
    ).to.not.be.reverted;

    const whiteListed = await contracts.cryptoCocks.list(0);

    expect(whiteListed.percRoyal).to.equal(percRoyal);
    expect(whiteListed.maxSupply).to.equal(maxSupply);
    expect(whiteListed.minBalance).to.equal(minBalance);
    expect(whiteListed.tracker).to.equal(0);
    expect(whiteListed.balance.toNumber()).to.equal(0);
    expect(whiteListed.cc).to.equal(cc);
    expect(whiteListed.wallet).to.equal(wallet);

    await expect(
      contracts.cryptoCocks
        .connect(accounts.nonOwner)
        .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
    ).to.be.reverted;

    // Check if numContracts was increased
    const settings = await contracts.cryptoCocks.set();
    expect(settings.numContracts).to.equal(1);
  });

  it("should be possible to add a white listing contracts up to total 20% royalty fee", async () => {
    // Add additional 10% fee contract with contracts.testTokenTwo
    const cc = contracts.testTokenTwo.address;
    const wallet = accounts.communityWallet2.address;
    const maxSupply = 2;
    const minBalance = 100;
    const percRoyal = 10;
    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
    ).to.be.not.reverted;

    const whiteListed = await contracts.cryptoCocks.list(1);

    expect(whiteListed.percRoyal).to.equal(percRoyal);
    expect(whiteListed.maxSupply).to.equal(maxSupply);
    expect(whiteListed.minBalance).to.equal(minBalance);
    expect(whiteListed.tracker).to.equal(0);
    expect(whiteListed.balance.toNumber()).to.equal(0);
    expect(whiteListed.cc).to.equal(cc);
    expect(whiteListed.wallet).to.equal(wallet);

    // Check if numContracts was increased
    const settings = await contracts.cryptoCocks.set();
    expect(settings.numContracts).to.equal(2);
  });

  it("should not be possible to add a white listing contract with more than 20% royalty fee", async () => {
    const cc = contracts.testTokenOne.address;
    const wallet = accounts.communityWallet1.address;
    const supply = 10;
    const balance = 100;
    const royalty = 1;

    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .addWhiteListing(cc, wallet, supply, balance, royalty)
    ).to.be.revertedWith("FEE_TOO_HIGH");
  });

  it("should be possible to receive balanceOf from external contracts via TokenInterface", async () => {
    // accounts.signerTokenOneBelow
    const queryTokenOneBelow = contracts.cryptoCocks.queryBalance(
      contracts.testTokenOne.address,
      accounts.signerTokenOneBelow.address
    );
    await expect(queryTokenOneBelow).to.not.be.reverted;
    expect(await queryTokenOneBelow).to.equal(BigNumber.from(99));

    // signerTokenOneAbove1
    const queryTokenOneAbove1 = contracts.cryptoCocks.queryBalance(
      contracts.testTokenOne.address,
      accounts.signerTokenOneAbove1.address
    );
    await expect(queryTokenOneAbove1).to.not.be.reverted;
    expect(await queryTokenOneAbove1).to.equal(BigNumber.from(100));

    // signerTokenOneAbove2
    const queryTokenOneAbove2 = contracts.cryptoCocks.queryBalance(
      contracts.testTokenOne.address,
      accounts.signerTokenOneAbove2.address
    );
    await expect(queryTokenOneAbove2).to.not.be.reverted;
    expect(await queryTokenOneAbove2).to.equal(BigNumber.from(150));

    // signerTokenOneAbove3
    const queryTokenOneAbove3 = contracts.cryptoCocks.queryBalance(
      contracts.testTokenOne.address,
      accounts.signerTokenOneAbove3.address
    );
    await expect(queryTokenOneAbove3).to.not.be.reverted;
    expect(await queryTokenOneAbove3).to.equal(BigNumber.from(300));

    // signerTokenTwoBelow
    const queryTokenTwoBelow = contracts.cryptoCocks.queryBalance(
      contracts.testTokenTwo.address,
      accounts.signerTokenTwoBelow.address
    );
    await expect(queryTokenTwoBelow).to.not.be.reverted;
    expect(await queryTokenTwoBelow).to.equal(BigNumber.from(99));

    // signerTokenTwoAbove
    const queryTokenTwoAbove = contracts.cryptoCocks.queryBalance(
      contracts.testTokenTwo.address,
      accounts.signerTokenTwoAbove.address
    );
    await expect(queryTokenTwoAbove).to.not.be.reverted;
    expect(await queryTokenTwoAbove).to.equal(BigNumber.from(100));

    // signerTokenBothAbove
    const queryTokenBothAbove1 = contracts.cryptoCocks.queryBalance(
      contracts.testTokenOne.address,
      accounts.signerTokenBothAbove.address
    );
    await expect(queryTokenBothAbove1).to.not.be.reverted;
    expect(await queryTokenBothAbove1).to.equal(BigNumber.from(100));
    const queryTokenBothAbove2 = contracts.cryptoCocks.queryBalance(
      contracts.testTokenTwo.address,
      accounts.signerTokenBothAbove.address
    );
    await expect(queryTokenBothAbove2).to.not.be.reverted;
    expect(await queryTokenBothAbove2).to.equal(BigNumber.from(100));
  });

  /*
 ████████╗███████╗███████╗████████╗    ███╗   ███╗██╗███╗   ██╗████████╗██╗███╗   ██╗ ██████╗
 ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ████╗ ████║██║████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝
    ██║   █████╗  ███████╗   ██║       ██╔████╔██║██║██╔██╗ ██║   ██║   ██║██╔██╗ ██║██║  ███╗
    ██║   ██╔══╝  ╚════██║   ██║       ██║╚██╔╝██║██║██║╚██╗██║   ██║   ██║██║╚██╗██║██║   ██║
    ██║   ███████╗███████║   ██║       ██║ ╚═╝ ██║██║██║ ╚████║   ██║   ██║██║ ╚████║╚██████╔╝
    ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
  */

  it("should not be possible to be possible to execute initial mint by non-owner", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    await expect(contracts.cryptoCocks.connect(accounts.nonOwner).initMint()).to
      .be.reverted;
  });

  it("should be possible to be possible to execute initial mint by owner only", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);
    const mintTx = await contracts.cryptoCocks
      .connect(accounts.owner)
      .initMint();
    await mintTx.wait();
    const lengths = [
      11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1,
      2, 3, 4, 5, 6, 7, 8, 9, 10,
    ];
    // expect `PermanentURI` event for newly minted token with correct length
    for (let i = 1; i <= 30; i++) {
      await expect(mintTx)
        .to.emit(contracts.cryptoCocks, "PermanentURI")
        .withArgs(`${lengths[i - 1]}/${i}/metadata.json`, BigNumber.from(i));
    }

    expect(await contracts.cryptoCocks.totalSupply()).to.equal(INIT_MINT_COUNT);
  });

  it("should not be possible to be possible to execute initial mint more than once", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    await expect(
      contracts.cryptoCocks.connect(accounts.owner).initMint()
    ).to.be.revertedWith("ONLY_ONCE");
    expect(await contracts.cryptoCocks.totalSupply()).to.equal(30);
  });

  it("should revert when wallet has insufficient funds", async () => {
    await setContractToPublicSale(contracts.cryptoCocks, accounts.owner);

    const signer = signers[0];
    const mintTx = contracts.cryptoCocks.connect(signer).mint({
      value: ethers.utils.parseEther("0.019"), // 0.02 ether needed
    });

    await expect(mintTx).to.be.revertedWith("INSUFFICIENT_FUNDS");
  });

  it("should be possible to mint for holders with minBalance of a whitelisted token before public sale start", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    const signersAbove = [
      accounts.signerTokenOneAbove1,
      accounts.signerTokenOneAbove2,
      accounts.signerTokenTwoAbove,
      accounts.signerTokenBothAbove,
    ];

    for (let i = 0; i < 4; i++) {
      const balance = await signersAbove[i].getBalance();
      let value = balance.div(100); // 1% or 1/100 of balance
      if (!value.gte(ethers.utils.parseEther("0.02"))) {
        value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
      }
      const mintTx = await contracts.cryptoCocks
        .connect(signersAbove[i])
        .mint({ value });
      const receipt = await mintTx.wait();
      const gasCost = mintTx.gasLimit.mul(receipt.effectiveGasPrice);

      // Adjust value by gas costs
      let adjustedValue = balance.sub(gasCost).div(100);
      if (!adjustedValue.gte(ethers.utils.parseEther("0.02"))) {
        adjustedValue = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
      }
      feesWhiteListed = feesWhiteListed.add(adjustedValue.div(10));

      // increase local counter
      tokenCounter += 1;
    }
  });

  it("should be able to observe changes in tracker and balance after minting in each white listed contract", async () => {
    for (let i = 0; i < 2; i++) {
      const contract = await contracts.cryptoCocks.list(i);
      expect(contract.tracker).to.equal(2);
      expect(contract.balance).to.equal(feesWhiteListed);
    }
  });

  it("should not be possible to mint for holders lower than minBalance of a whitelisted token before public sale start", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    const signersBelow = [
      accounts.signerTokenOneBelow,
      accounts.signerTokenTwoBelow,
    ];

    for (let i = 0; i < signersBelow.length; i++) {
      const balance = await signersBelow[i].getBalance();
      let value = balance.div(100); // 1% or 1/100 of balance
      if (!value.gte(ethers.utils.parseEther("0.02"))) {
        value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
      }
      await expect(
        contracts.cryptoCocks.connect(signersBelow[i]).mint({
          value,
        })
      ).to.be.revertedWith("LOCK");
    }
  });

  it("should not be possible to mint if maxSupply of a whitelisted token is reached before public sale start", async () => {
    // Set contract to standard settings
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    const balance = await accounts.signerTokenOneAbove3.getBalance();
    let value = balance.div(100); // 1% or 1/100 of balance
    if (!value.gte(ethers.utils.parseEther("0.02"))) {
      value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
    }
    await expect(
      contracts.cryptoCocks.connect(accounts.signerTokenOneAbove3).mint({
        value,
      })
    ).to.be.revertedWith("LOCK");
  });

  it("should be possible to mint NFT for free with freeMinting", async () => {
    await setContractToFreeSale(contracts.cryptoCocks, accounts.owner);

    const tokenId = percentileData[tokenCounter].token_id;
    const balance = await accounts.freeSigner.getBalance();
    let value = balance.div(100); // 1% or 1/100 of balance
    if (!value.gte(ethers.utils.parseEther("0.02"))) {
      value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
    }

    const mintTx = await contracts.cryptoCocks
      .connect(accounts.freeSigner)
      .mint();

    // wait until the transaction is mined
    await mintTx.wait();

    await expect(mintTx)
      .to.emit(contracts.cryptoCocks, "PermanentURI")
      .withArgs(
        `${
          percentileData[parseInt(tokenId) - INIT_MINT_COUNT - 1].length_new
        }/${tokenId}/metadata.json`,
        BigNumber.from(tokenId)
      );

    // increase local counter
    tokenCounter += 1;
  });

  it("should be able to mint 100 tokens during public sale", async () => {
    await setContractToPublicSale(contracts.cryptoCocks, accounts.owner);

    let batchFees = BigNumber.from("0").add(feesWhiteListed.mul(10));
    let totalFees = BigNumber.from("0");
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const balance = await signer.getBalance();
      let value = balance.div(100); // 1% or 1/100 of balance
      if (!value.gte(ethers.utils.parseEther("0.02"))) {
        value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
      }

      const mintTx = await contracts.cryptoCocks.connect(signer).mint({
        value,
      });

      // wait until the transaction is mined
      const receipt = await mintTx.wait();
      const gasCost = mintTx.gasLimit.mul(receipt.effectiveGasPrice);

      // Adjust value by gas costs
      let adjustedValue = balance.sub(gasCost).div(100);
      if (!adjustedValue.gte(ethers.utils.parseEther("0.02"))) {
        adjustedValue = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
      }
      batchFees = batchFees.add(adjustedValue);

      const tokenId = percentileData[tokenCounter].token_id;

      // expect `Transfer` event of token from contract to wallet
      await expect(mintTx)
        .to.emit(contracts.cryptoCocks, "Transfer")
        .withArgs(ethers.constants.AddressZero, signer.address, tokenId); // (from, to, tokenId)

      // expect `PermanentURI` event for newly minted token with correct length
      await expect(mintTx)
        .to.emit(contracts.cryptoCocks, "PermanentURI")
        .withArgs(
          `${
            percentileData[parseInt(tokenId) - INIT_MINT_COUNT - 1].length_new
          }/${tokenId}/metadata.json`,
          BigNumber.from(tokenId)
        );

      // expect fee transfers with every 50th mint
      if (parseInt(tokenId) % 50 === 0) {
        const provider = waffle.provider;
        totalFees = totalFees.add(batchFees);

        expect(await provider.getBalance(TEAM_WALLET)).to.closeTo(
          totalFees.div(2),
          100
        );
        expect(await provider.getBalance(DONATION_WALLET)).to.closeTo(
          totalFees.div(10).mul(3),
          100
        );
        // reset batchFees for next 50 mints
        batchFees = BigNumber.from("0");
      }

      // increase local counter
      tokenCounter += 1;

      // check for updated supply
      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT + tokenCounter
      );

      // only allow one mint per address
      const mintTxTwo = contracts.cryptoCocks.connect(signer).mint({
        value: ethers.utils.parseEther("0.02"), // 0.02 ether needed
      });
      await expect(mintTxTwo).to.be.revertedWith("ONLY_ONE_NFT");
    }
  }).timeout(0);

  it("should not be possible to mint publicly before public sale started", async () => {
    await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);

    const signer = signers[0];
    const mintTxLock = contracts.cryptoCocks.connect(signer).mint({
      value: ethers.utils.parseEther("0.02"),
    });
    await expect(mintTxLock).to.be.revertedWith("LOCK");
  });

  it("should be able to get the token URI from the token id", async () => {
    for (
      let tokenId = INIT_MINT_COUNT + 1;
      tokenId <= CONFIG_ACCOUNT_COUNT;
      tokenId++
    ) {
      const tokenUri = await contracts.cryptoCocks.tokenURI(tokenId);
      expect(tokenUri).to.equal(
        `ifps://bafybeicftqysvuqz2aa4ivf3af3usqwt435h6iae7nhompakqy2uh5drye/${
          percentileData[tokenId - INIT_MINT_COUNT - 1].length_new
        }/${tokenId}/metadata.json`
      );
    }
  });

  /*
████████╗███████╗███████╗████████╗    ████████╗██████╗  █████╗ ███╗   ██╗███████╗███████╗███████╗██████╗ ███████╗
╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝
   ██║   █████╗  ███████╗   ██║          ██║   ██████╔╝███████║██╔██╗ ██║███████╗█████╗  █████╗  ██████╔╝███████╗
   ██║   ██╔══╝  ╚════██║   ██║          ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██╔══╝  ██╔══╝  ██╔══██╗╚════██║
   ██║   ███████╗███████║   ██║          ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║     ███████╗██║  ██║███████║
   ╚═╝   ╚══════╝╚══════╝   ╚═╝          ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝                                                                                                              
   */

  it("should not be possible to withdraw balance for non-whitelisted wallets", async () => {
    const nonCommunityWallets = signers;
    nonCommunityWallets.push(
      accounts.owner,
      accounts.freeSigner,
      accounts.signerTokenOneBelow,
      accounts.signerTokenOneAbove1,
      accounts.signerTokenOneAbove2,
      accounts.signerTokenOneAbove3,
      accounts.signerTokenTwoBelow,
      accounts.signerTokenTwoAbove,
      accounts.signerTokenBothAbove
    );

    for (let i = 0; i < nonCommunityWallets.length; i++) {
      const prevBalance = await nonCommunityWallets[i].getBalance();
      const transferTx = await contracts.cryptoCocks
        .connect(nonCommunityWallets[i])
        .transferRoyalty();
      const receipt = await transferTx.wait();
      const gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
      const newBalance = await nonCommunityWallets[i].getBalance();
      // No change other than gas costs expected for the wallet balance
      expect(prevBalance.sub(gasCost)).to.equal(newBalance);
    }
  });

  it("should be possible to withdraw balance for white listed wallet", async () => {
    const communityWallets = [
      accounts.communityWallet1,
      accounts.communityWallet2,
    ];
    for (let i = 0; i < communityWallets.length; i++) {
      const prevBalance = await communityWallets[i].getBalance();
      const contract = await contracts.cryptoCocks.list(i);
      const transferTx = await contracts.cryptoCocks
        .connect(communityWallets[i])
        .transferRoyalty();
      const receipt = await transferTx.wait();
      // Get gas cost as recipient is also sender of transaction
      const gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
      const newBalance = await communityWallets[i].getBalance();
      const diff = newBalance.sub(prevBalance);
      // Add gas cost to wallet balance to match contract balance
      expect(diff.add(gasCost)).to.equal(contract.balance);

      // Check balance in contract after transfer
      const contractAfter = await contracts.cryptoCocks.list(i);
      expect(contractAfter.balance).to.equal(BigNumber.from("0"));
    }
  });
});
