// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks } from "../typechain";
import {
  saveABIJson,
  saveAddressesJson,
  saveChainJson,
  saveOwnerJson,
  // eslint-disable-next-line node/no-missing-import
} from "./generator";

async function main() {
  // deploy libraries
  const OrderStatisticsTreeLib = await ethers.getContractFactory(
    "OrderStatisticsTreeLib"
  );
  const orderStatisticsTreeLib = await OrderStatisticsTreeLib.deploy();
  await orderStatisticsTreeLib.deployed();

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLib.address,
    },
  });
  const cryptoCocks = (await CryptoCocks.deploy()) as CryptoCocks;
  await cryptoCocks.deployed();

  console.log("CryptoCocks contract deployed to:", cryptoCocks.address);

  const signers = await ethers.getSigners();
  const owner = signers[0];
  const network = await ethers.getDefaultProvider().getNetwork();
  const chainId = network.chainId;

  saveOwnerJson(owner.address);
  saveChainJson(chainId);
  saveAddressesJson({
    CryptoCocks: cryptoCocks.address,
  });
  saveABIJson("CryptoCocks");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
