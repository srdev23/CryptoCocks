// eslint-disable-next-line node/no-missing-import,node/no-unpublished-import
import { loadPercentileData, PercentileDataEntry } from "./test/percentiles";
// eslint-disable-next-line node/no-unpublished-import
import { HardhatNetworkAccountUserConfig } from "hardhat/types";
// eslint-disable-next-line node/no-unpublished-import
import { utils } from "ethers";
// eslint-disable-next-line node/no-unpublished-import
import { deriveKeyFromMnemonicAndPath } from "hardhat/internal/util/keys-derivation";
// eslint-disable-next-line node/no-unpublished-import
import { bufferToHex } from "ethereumjs-util";
import * as fs from "fs";

const MNEMONIC =
  "hollow cycle obscure tumble office alarm slam fragile online peace wink together";
const HD_PATH = "m/44'/60'/0'/0/";

loadPercentileData().then((data: PercentileDataEntry[]) => {
  const accounts = data.map((entry: PercentileDataEntry, index) => {
    const account: HardhatNetworkAccountUserConfig = {
      balance: utils.parseEther(entry.balance).toString(),
      privateKey: bufferToHex(
        deriveKeyFromMnemonicAndPath(MNEMONIC, `${HD_PATH}${index + 1}`)!
      ),
    };
    return account;
  });

  // add owner
  accounts.unshift({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "0")!
    ),
  });

  fs.writeFileSync("accounts.json", JSON.stringify(accounts));
});
