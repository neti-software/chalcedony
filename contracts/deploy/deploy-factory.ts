import { Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the AccountFactory contract`);

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const accountArtifact = await deployer.loadArtifact("Account");
  const factoryArtifact = await deployer.loadArtifact("AccountFactory");

  const args = [utils.hashBytecode(accountArtifact.bytecode)];
  const factoryContract = await deployer.deploy(factoryArtifact, args, undefined, [
    accountArtifact.bytecode
  ]);

  console.log(`${factoryArtifact.contractName} was deployed to ${factoryContract.address}`);
}
