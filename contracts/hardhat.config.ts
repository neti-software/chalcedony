import { HardhatUserConfig } from "hardhat/config";

import '@typechain/hardhat'
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@matterlabs/hardhat-zksync-chai-matchers";


// dynamically changes endpoints for local tests
const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    : {
        url: "https://testnet.era.zksync.dev",
        ethNetwork: "goerli",
        zksync: true,
      };

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest", // Uses latest available in https://github.com/matter-labs/zksolc-bin/
    settings: {
      isSystem: true,
    },
  },
  // defaults to zkSync network
  defaultNetwork: "zkSyncTestnet",
  networks: {
    era: {
	   url: 'http://localhost:8011',
	   ethNetwork: "http://localhost:8545",
	   zksync: true,
    },
    hardhat: {
      zksync: false,
    },
    // load test network details
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.19",
  },
  typechain: {
    target: 'ethers-v5',
  },
};

export default config;
