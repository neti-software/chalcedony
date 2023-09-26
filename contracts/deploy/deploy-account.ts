import { Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY || "";
const SMART_ACCOUNT_PRIVATE_KEY = process.env.SMART_ACCOUNT_PRIVATE_KEY || "";
const WITNESS_PRIVATE_KEY = process.env.WITNESS_PRIVATE_KEY || "";

if (!PRIVATE_KEY || !SMART_ACCOUNT_PRIVATE_KEY || !WITNESS_PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Account contract`);

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY);
  const smartAccountWallet = new Wallet(SMART_ACCOUNT_PRIVATE_KEY);
  const witnessWallet = new Wallet(WITNESS_PRIVATE_KEY);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet, 'createAccount');
  const artifact = await deployer.loadArtifact("Account");

  const args = [
    `did:ethr:${smartAccountWallet.address}`,
    `did:ethr:${witnessWallet.address}`,
  ];
  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, args);

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

  const AccountContract = await deployer.deploy(artifact, args);

  //obtain the Constructor Arguments
  console.log(
    "Constructor args:" + AccountContract.interface.encodeDeploy(args)
  );

  // Show the contract info.
  const contractAddress = AccountContract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  // verify contract for tesnet & mainnet
  if (process.env.NODE_ENV != "test") {
    // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
    const contractFullyQualifedName = "contracts/Account.sol:Account";

    // Verify contract programmatically
    const verificationId = await hre.run("verify:verify", {
      address: contractAddress,
      contract: contractFullyQualifedName,
      constructorArguments: args,
      bytecode: artifact.bytecode,
    });
  } else {
    console.log(`Contract not verified, deployed locally.`);
  }
}
