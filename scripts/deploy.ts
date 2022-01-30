// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks } from "../typechain";

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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
