import * as dotenv from "dotenv";
import { utils } from "ethers";
import { HardhatUserConfig, task } from "hardhat/config";
import { HardhatNetworkAccountUserConfig } from "hardhat/types/config";
import { deriveKeyFromMnemonicAndPath } from "hardhat/internal/util/keys-derivation";
import { bufferToHex } from "ethereumjs-util";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import { removeConsoleLog } from "hardhat-preprocessor";
import { parseFile } from "@fast-csv/parse";

dotenv.config();

const MNEMONIC =
  "hollow cycle obscure tumble office alarm slam fragile online peace wink together";
const HD_PATH = "m/44'/60'/0'/0/";

interface PercentileDataEntry {
  token_id: string;
  balance: string;
  length: string;
  length_new: string;
}

/**
 * Loads the data from the file `percentiles.csv`
 */
async function loadPercentileData(): Promise<PercentileDataEntry[]> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<PercentileDataEntry[]>(async (resolve, reject) => {
    const entries: PercentileDataEntry[] = [];
    parseFile("percentiles.csv", { headers: true })
      .on("error", (error) => {
        return reject(error);
      })
      .on("data", (entry: PercentileDataEntry) => {
        entries.push(entry);
      })
      .on("end", () => {
        return resolve(entries);
      });
  });
}

let idx = 0;
// Create owner and non-minter accounts
const customAccounts: HardhatNetworkAccountUserConfig[] = [];
for (let i = 0; i < 6; i++) {
  const newAccount: HardhatNetworkAccountUserConfig = {
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + idx.toString())!
    ),
  };
  customAccounts.push(newAccount);
  idx++;
}

// Create minter accounts
async function prepareAccounts() {
  const percentileData = await loadPercentileData();
  for (const entry of percentileData) {
    const newAccount: HardhatNetworkAccountUserConfig = {
      balance: utils.parseEther(entry.balance).toString(),
      privateKey: bufferToHex(
        deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + idx.toString())!
      ),
    };
    customAccounts.push(newAccount);
    idx++;
  }
  // console.log(customAccounts);
  return customAccounts;
}

prepareAccounts();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  networks: {
    hardhat: {
      accounts: [
        {
          balance: "100000000000000000000000",
          privateKey:
            "0x92a47462375e569b2a440610856ac5718c69601eca024d6a9d86a87469ce6c0b",
        },
        {
          balance: "100000000000000000000000",
          privateKey:
            "0xcc72c1a2115f4f9c262753644cd49acd39587abb0c315ff890657eb409601a54",
        },
        {
          balance: "100000000000000000000000",
          privateKey:
            "0x04fce3449ac4c70dd60dd7a3bfa9a606f3320adbe58d2387cd20ac4846b95d1e",
        },
        {
          balance: "100000000000000000000000",
          privateKey:
            "0x3de2ce470af6bf160f841c833c00055664dfd728fe28d1451863c1b92c9e2f56",
        },
        {
          balance: "100000000000000000000000",
          privateKey:
            "0xb4db0f19acef10aa6e313d15b6e89788c3468ed9f1e1d081c128e1fdc9cb966d",
        },
        {
          balance: "100000000000000000000000",
          privateKey:
            "0x36ec6bf5e32a757f13182ab73830b1b4c19f63ff33be2eb6c5d3f96f53a96dc6",
        },
        {
          balance: "2087000000000000000000",
          privateKey:
            "0xd0d8587d96c7cc108a0aa6c93dddab52c08560557bdf7685711e8a51c71b3413",
        },
        {
          balance: "1495000000000000000000",
          privateKey:
            "0x021a7bc3dd6479e2e9c8a5b18e69de6d35e0da08b44e7cb103a006247ccdb29f",
        },
        {
          balance: "2200000000000000000000",
          privateKey:
            "0xf73444f56c1080c65aff28500736f11b4751f66c7efb30bea31305e8cf2ea55a",
        },
        {
          balance: "1824000000000000000000",
          privateKey:
            "0xffe721353882cb37aae630b816b8799724d51d5febe1a95ec0775e8c8f0efc82",
        },
        {
          balance: "3308000000000000000000",
          privateKey:
            "0xac5538aeecc66d817e0d94452f5d4f190a733b7e4c8e5378b6669ebf80698100",
        },
        {
          balance: "1548000000000000000000",
          privateKey:
            "0xbf59945116531cd34538ecdc8f0626dbdeed320e786b6f60899a8e75442bf9a8",
        },
        {
          balance: "3402000000000000000000",
          privateKey:
            "0x5490eb95a194a216807d3492f5605391670532720f803dbf06d567cb29350389",
        },
        {
          balance: "1717000000000000000000",
          privateKey:
            "0x7ab778407bf4b2296f25ca5847f587d6c1ff8fdecd5b4e4e08c719421c198e3a",
        },
        {
          balance: "4164000000000000000000",
          privateKey:
            "0x016de72548abb8b20145f14ce278991a47e1a3abd61fe1f524813d4b74824dbc",
        },
        {
          balance: "1852000000000000000000",
          privateKey:
            "0xa7a02a40c55d461190bc1f231ef807dfa33cbb0219b09637fdd0f1a5aefac8f3",
        },
        {
          balance: "1569000000000000000000",
          privateKey:
            "0x242152ad2cd2ced1a42e0df911584a9b8bec898df6a550623816c1fa9ccc1d08",
        },
        {
          balance: "2369000000000000000000",
          privateKey:
            "0x39b9c72be22ec1ed1db74cbda46f22ca2f5445008c54630e99378822202d8a97",
        },
        {
          balance: "632000000000000000000",
          privateKey:
            "0xf66809a6bb04c5e6328c1458ac947c7c4e94cc2800c59123e321c7f667342e6d",
        },
        {
          balance: "1384000000000000000000",
          privateKey:
            "0x1c9e5aa56748e49be38dff4d43c9b0b88be0c876672bd6ce882416df8bfeab70",
        },
        {
          balance: "82000000000000000000",
          privateKey:
            "0x8f3bc6a18579a59cbe69aab79988b3867e52e56c1c62be18228831ab0e9f9872",
        },
        {
          balance: "197000000000000000000",
          privateKey:
            "0x90ff6f67bc1cb78e0b49b901f422c17fc067170c5e4f505cdbb938caa2d8f628",
        },
        {
          balance: "4457000000000000000000",
          privateKey:
            "0x6a15e942e086ad0563a6acdeb19135afb545e8c93b55ef22e9564ed421884eb1",
        },
        {
          balance: "1666000000000000000000",
          privateKey:
            "0x654aa7f042c9bc18536bee09acf0e508b96f5571e4ce154945430c392c9415dd",
        },
        {
          balance: "4235000000000000000000",
          privateKey:
            "0xe3a8ba152805b400dad2cb7a2a984b4cb3f0b44de2327407bff3315846851212",
        },
        {
          balance: "173000000000000000000",
          privateKey:
            "0xc1ead751aa94b8abc2092853c9df4e6c978b7ab356ff408e25bb319beb433d26",
        },
        {
          balance: "1750000000000000000000",
          privateKey:
            "0x84c51a5fb53e787348c056f1d218e0c776df80b74c13388e2db6e67e31f01c8d",
        },
        {
          balance: "4480000000000000000000",
          privateKey:
            "0xee0d49076150e0e6412b59d4cd0bf47250b3519d310a52c8114a78f00ec7d5a9",
        },
        {
          balance: "4443000000000000000000",
          privateKey:
            "0xb6e2711bf8aaa664ce275475e4760707e19b675c79ff6d9f75e98e9d0af59c2a",
        },
        {
          balance: "2606000000000000000000",
          privateKey:
            "0x8a7f83c7aae28dc624bfd9d591752e1be9befb44fa38566c3443dfa83809cb88",
        },
        {
          balance: "1438000000000000000000",
          privateKey:
            "0x5f495559aa84209c3d2e6c3a417f0b53ed44db67e11c43091ffa3c12523cd5ef",
        },
        {
          balance: "2095000000000000000000",
          privateKey:
            "0x836b5837b6c2f7823068ddf837f2f1f11a34af0300973b3be43f11bfb3d99ae7",
        },
        {
          balance: "1061000000000000000000",
          privateKey:
            "0x6a13e3395c7791456c17343fab6d105d5ce64489d4d0b5e2d5e5d1a46fe39012",
        },
        {
          balance: "1953000000000000000000",
          privateKey:
            "0x9fe47f9b703264cc08b7bcafa4cd5971f5a525378b6975276cdddd5f16b64074",
        },
        {
          balance: "1237000000000000000000",
          privateKey:
            "0x4e3059b322aadc154442726f7b14338a9fbc6f1fc9444b1f78c7a2face965d0d",
        },
        {
          balance: "2951000000000000000000",
          privateKey:
            "0xfbb965406bc0a420ab24378fc719d1a8286b8439596ea58f6fd565108da1467d",
        },
        {
          balance: "2022000000000000000000",
          privateKey:
            "0x35713a27eeba6b8ac8146001975fe22b3dd4f6175cdbf2de7c19b030b8e93f57",
        },
        {
          balance: "3334000000000000000000",
          privateKey:
            "0x3ccfaa7dc39a95fc0d4c04467f282ca0ed89910d301d731aa720cfe8246a0529",
        },
        {
          balance: "1782000000000000000000",
          privateKey:
            "0xfaab57b50b277d398db5437404a5435838769bb785151f5aa3b62e2454bc644c",
        },
        {
          balance: "3764000000000000000000",
          privateKey:
            "0x8cc6c08ec1edc493672c42bfe4feba0c0ea1584379df996bc19d726b3cc9fbee",
        },
        {
          balance: "54000000000000000000",
          privateKey:
            "0x283e80bd43f7e7e3376ab2d6fb8f8adbd63d25852fa98c06e2cd2ac6c55d6f84",
        },
        {
          balance: "1093000000000000000000",
          privateKey:
            "0x674d50a746fd897ad9bc82e410be0833b301bea46fdcfb647947d527275e39d9",
        },
        {
          balance: "4082000000000000000000",
          privateKey:
            "0xf0e5490837edefa46e6c76ff4051cf98647e29c6eb0229909c697dc02a590bf3",
        },
        {
          balance: "4521000000000000000000",
          privateKey:
            "0x6bb04dee3705048442e9dadbdbe4f2105d4600508e46285e259de0c585b9b7bc",
        },
        {
          balance: "825000000000000000000",
          privateKey:
            "0xc34e84833c8affc9a50bab3fe3d155783c3e951f463e792053bbcb11d44e8f55",
        },
        {
          balance: "2480000000000000000000",
          privateKey:
            "0xbc65640842b9554b90068e40b513e53fee38204fafa8243732599f7277f976f7",
        },
        {
          balance: "1284000000000000000000",
          privateKey:
            "0x2e55d954b858f9b097c45e09dfd11325ec36e7fbb1b2cf5e1f5b0e1b6d23659f",
        },
        {
          balance: "1147000000000000000000",
          privateKey:
            "0xef95581f64afff3b9780c38a5d3cfacc1eec498ff0e38a4993116a33559ea371",
        },
        {
          balance: "1778000000000000000000",
          privateKey:
            "0xd91ce8c296cd450f7cf357d0f0f1dcbb6c928c74b9f86a63bd49f79712c5db80",
        },
        {
          balance: "3556000000000000000000",
          privateKey:
            "0x85607188af354017459ed3ad7c2ff6a45408ff08b9910b703aa6420c647a7ed5",
        },
        {
          balance: "3012000000000000000000",
          privateKey:
            "0x4680576639fddf5b2e694a8688670ce3968082d62b2fcccf2fca4ebddda3b26f",
        },
        {
          balance: "1485000000000000000000",
          privateKey:
            "0x05df6ecbfc588be9eccde596d24853e6b37b0a2244cfe504ac8d6ed84920df75",
        },
        {
          balance: "3782000000000000000000",
          privateKey:
            "0xdd3c83619023ce3c1a01f379c2bfea38b32bbe04e8647ada5daf9ee5164ee871",
        },
        {
          balance: "3464000000000000000000",
          privateKey:
            "0x8cf8a41f57ded4c28eed97cd06e1aa3c4d509d6b36d2f8329a0fadc133c8856a",
        },
        {
          balance: "4256000000000000000000",
          privateKey:
            "0x58f98e93752a6ae59ee388dfd2782ad9f5779b19f09b7a495c0b9eb653e5482b",
        },
        {
          balance: "3829000000000000000000",
          privateKey:
            "0x2175c4288ebb429f58aeed50630da283d80d3bba2dc79510161622c03fb4f9c3",
        },
        {
          balance: "3967000000000000000000",
          privateKey:
            "0x6326737a638732328b2660f1cc67a1cea98755b780d4b73ec6baf9fd126a1c61",
        },
        {
          balance: "2509000000000000000000",
          privateKey:
            "0x0e0c50934dab5c7adb1e0df4e20ccdb970cdff1376cb93ba99ca5b92db193760",
        },
        {
          balance: "797000000000000000000",
          privateKey:
            "0x6ab9204c4fa6532a72f671242b741c0d0a5d2a962b4098fe8ec9f6fa416795d7",
        },
        {
          balance: "3421000000000000000000",
          privateKey:
            "0xf6aaa31790361fb874a4c970ef20b192cfa38ed8b8868e976c5d85eabf067378",
        },
        {
          balance: "3290000000000000000000",
          privateKey:
            "0x695004d487ba154b2770c8756650b152c5853944efa7384f45af53fe4b78740e",
        },
        {
          balance: "3896000000000000000000",
          privateKey:
            "0xadc8db64f021dd5078997b5183db7e2c5cf21936fcf65f3289fd0b714e3b33b8",
        },
        {
          balance: "4725000000000000000000",
          privateKey:
            "0x95fdb55b7270d43d8f04cc310221ca1a32622d19d744d6cc67c8f29439b11188",
        },
        {
          balance: "1235000000000000000000",
          privateKey:
            "0xf2f95dc6acc5ef7e0603db2921622dd4993c4d45c0d1d51ff596c5e244148d04",
        },
        {
          balance: "1432000000000000000000",
          privateKey:
            "0xfc3cfc6a0e3e5b906ef6163ab375046690eff3ae57dcdb454658acb991132a77",
        },
        {
          balance: "3558000000000000000000",
          privateKey:
            "0x1261bfbbc697f3adc08d2d08062a453d482a3f048caecc6934259a47ac8b6723",
        },
        {
          balance: "1459000000000000000000",
          privateKey:
            "0xaf06d2a69d90c90148cacd3aa52bd6d542d2d13d95644ac4f053e0aed285fe85",
        },
        {
          balance: "879000000000000000000",
          privateKey:
            "0xc88dea857a13c31549bd5be08233ed052da64cd1b12d5e67878112c75a8e56ac",
        },
        {
          balance: "4591000000000000000000",
          privateKey:
            "0x1b9bd01f578148fe1a1499319df8520eb8a647185ea70531198d66abc135ccb1",
        },
        {
          balance: "2218000000000000000000",
          privateKey:
            "0xf2a52707f9220f4e9005d92e3cd3ae5de003e1bf895a191a6ef39c4bcdae1be7",
        },
        {
          balance: "3953000000000000000000",
          privateKey:
            "0x71b40861086c1797fbe6a03f3b42b03dc2bc803ae41d4ee8f54ce789d5250100",
        },
        {
          balance: "3633000000000000000000",
          privateKey:
            "0xd0f03fbdfc2c5e51b92904a34149f999b1b3047b84f4ad72943b973d0050656d",
        },
        {
          balance: "3655000000000000000000",
          privateKey:
            "0x4a8bd60ce4fbdbfe271c31a335e02e84503adabbb5c3ee8e32a6e367f88a372c",
        },
        {
          balance: "3748000000000000000000",
          privateKey:
            "0xf87a0dc02e9d37f569ee4cb4198e2637f19fba78ccd516f43359ac07dc44f236",
        },
        {
          balance: "571000000000000000000",
          privateKey:
            "0xa9b008318dc90cf73ca28f1ee182e24ddb2695e529b048e459189c4a54d3278e",
        },
        {
          balance: "3489000000000000000000",
          privateKey:
            "0x7c18057691f2e6b82fc0e17379ea8571d86991039c2d1b34174a31f1a888b93f",
        },
        {
          balance: "969000000000000000000",
          privateKey:
            "0x9ab5060f574e55d1ec93437a475547db79502e3b4d04eb7a088711d24879c3bd",
        },
        {
          balance: "3902000000000000000000",
          privateKey:
            "0xfeb44d54699aa8a860dcc54eb9386a6c6ddcbc18c36cd795e0b0a9b6b83e2d9d",
        },
        {
          balance: "106000000000000000000",
          privateKey:
            "0x5be8df0cd01f07f6b3809159fc83ad0df2e6f253856dfb8cf68d3bf946aa6b36",
        },
        {
          balance: "3533000000000000000000",
          privateKey:
            "0x70e913e9e5a8d6f67cb79c3ee387d3ce648e51487a5590c48406632a11ce92ac",
        },
        {
          balance: "3655000000000000000000",
          privateKey:
            "0x4c07f740e3bf246130a451623ba4f2dfcc323f293fc6fb40349929bb242ff366",
        },
        {
          balance: "3712000000000000000000",
          privateKey:
            "0xcb113d24e8c5c726fe0b7138fda8102b80988fe7094c3e4d6b22a38c1706265f",
        },
        {
          balance: "1056000000000000000000",
          privateKey:
            "0xee3f590d027bd1373c28e86ca957c25832f292d74833f2cc3c7a25dcbe235d5e",
        },
        {
          balance: "2213000000000000000000",
          privateKey:
            "0x2ef256674a7f1049908ac51e7f5c46bfed69ea1485bc912d845bac41965ceb5f",
        },
        {
          balance: "11000000000000000000",
          privateKey:
            "0x029772ef85c89bf5b1f2dbfc3f478827409bc905bec26c6a3e0730eb61ca81ad",
        },
        {
          balance: "2212000000000000000000",
          privateKey:
            "0x5abebe7597ab6dbe064e8d8c62efaa7b682dcedfac98d29a730211b23d83e049",
        },
        {
          balance: "2108000000000000000000",
          privateKey:
            "0xed7a723c578bcfb17fe95f89742a96b0989865e47c5577eef75fed6893398479",
        },
        {
          balance: "2774000000000000000000",
          privateKey:
            "0x4d8085dbd13078ae77e106da53bc3a845a35e83064aba1a6cdea19cefc96b246",
        },
        {
          balance: "3014000000000000000000",
          privateKey:
            "0x281c14fd9f64724fb63bacb3c4222c5ab1d75f223d6027faf80d5c1ae8fa7418",
        },
        {
          balance: "3613000000000000000000",
          privateKey:
            "0xe7186e38dab95b3eb6601342e5dbd99eb675746f10e3e14156d51ae0a8dfd78b",
        },
        {
          balance: "2171000000000000000000",
          privateKey:
            "0xeee4334704c5f86b1d89c074cfbda5c0948a1274d46ef8047822f4452c669376",
        },
        {
          balance: "1680000000000000000000",
          privateKey:
            "0xb49aaf52f9603b4a2022cd11ab3b973ee73c831ac2e25ac16de446efa23bce1c",
        },
        {
          balance: "1415000000000000000000",
          privateKey:
            "0x8b8d965c9219eddcdb3b6b15d5b5316db2b8fa80f89b612c26fa347c8624b4d0",
        },
        {
          balance: "4804000000000000000000",
          privateKey:
            "0xd338b0d28c27eb12500e7a289e69eba5bfebecdeb472379fbcfe0a6ede4171b2",
        },
        {
          balance: "996000000000000000000",
          privateKey:
            "0x683e98e82a8277f978e39cc1f33a83054edab33d17622dc869ed46ea6621e6b8",
        },
        {
          balance: "1907000000000000000000",
          privateKey:
            "0x91d3b39aaf10dbf587eace56509d28e402054fc1343ad6d634028db50cf4e40b",
        },
        {
          balance: "4149000000000000000000",
          privateKey:
            "0xebbc099a54b0d32d8e7ba38abdac830ea01aa1f00f6e03e250a0b474f440ad54",
        },
        {
          balance: "4783000000000000000000",
          privateKey:
            "0x65a0192c5f9b0d693876854d671ee4e060eebb16d81289adbf3143e763c53a06",
        },
        {
          balance: "608000000000000000000",
          privateKey:
            "0x9d1d876ac4611871b254bd1fc82495744ae309d429e54b27a43acc80f61092ef",
        },
        {
          balance: "4815000000000000000000",
          privateKey:
            "0x8032dcb614084b3d9e246dc8b81ff559c9216f813b218f4db4337ae9d4b1bf96",
        },
      ],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  preprocess: {
    eachLine: removeConsoleLog(
      (hre) =>
        (hre.network.name !== "hardhat" && hre.network.name !== "localhost") ||
        process.env.HIDE_CONTRACT_LOGS === "true"
    ),
  },

  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

export default config;
