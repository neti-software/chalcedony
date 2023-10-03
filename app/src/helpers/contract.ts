import { ContractInterface } from "ethers";
import { Contract, Provider, Signer } from "zksync-web3";
import Account from "../contracts/Account.json";
import AccountFactory from "../contracts/AccountFactory.json";
import IEncodings from "../contracts/IEncodings.json";
import Paymaster from "../contracts/Paymaster.json";
import Token from "../contracts/Token.json";
import {
  ACCOUNT_FACTORY_CONTRACT,
  PAYMASTER_CONTRACT,
  RPC_ENDPOINT_URL,
} from "./config";

export const CONTRACTS = {
  Token,
  AccountFactory,
  Paymaster,
  IEncodings,
  Account,
};

const CONTRACTS_CACHE: { [key: string]: Contract } = {};

export const zkSyncProvider =
  import.meta.env.VITE_NODE_ENV == "test"
    ? {
        url: RPC_ENDPOINT_URL,
        ethNetwork: "http://localhost:8545",
      }
    : {
        url: "https://testnet.era.zksync.dev",
        ethNetwork: "goerli",
      };

export const getReadContractByAddress = (
  contract: { abi: ContractInterface },
  address: string,
  signer?: Signer
): Contract => {
  if (CONTRACTS_CACHE[address]) return CONTRACTS_CACHE[address];
  const provider = signer ?? new Provider(zkSyncProvider.url);

  const contractInstance = new Contract(address, contract.abi, provider);
  CONTRACTS_CACHE[address] = contractInstance;
  return contractInstance;
};

export const getWriteContractByAddress = (
  contract: { abi: ContractInterface },
  address: string,
  signer: Signer
): Contract => {
  const contractInstance = new Contract(address, contract.abi, signer);
  return contractInstance;
};

export const getPaymasterContract = (signer: Signer): Contract => {
  return getWriteContractByAddress(
    CONTRACTS.Paymaster,
    PAYMASTER_CONTRACT,
    signer
  );
};

export const getAccountFactoryContract = (signer: Signer): Contract => {
  return getWriteContractByAddress(
    CONTRACTS.AccountFactory,
    ACCOUNT_FACTORY_CONTRACT,
    signer
  );
};
