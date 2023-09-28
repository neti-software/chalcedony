import { Contract, Provider, Signer } from "zksync-web3";
import { ContractInterface, ethers } from "ethers";
import Token from "../contracts/Token.json";
import AccountFactory from "../contracts/AccountFactory.json";
import Paymaster from "../contracts/Paymaster.json";
import IEncodings from "../contracts/IEncodings.json";
import Account from "../contracts/Account.json";

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
        url: "http://localhost:3050",
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

const PAYMASTER_CONTRACT = import.meta.env.VITE_PAYMASTER_CONTRACT ?? ethers.constants.AddressZero;
export const getPaymasterContract = (
  signer?: Signer
): Contract => {
  return getReadContractByAddress(CONTRACTS.Paymaster, PAYMASTER_CONTRACT, signer);
}

const ACCOUNT_FACTORY_CONTRACT = import.meta.env.VITE_ACCOUNT_FACTORY_CONTRACT ?? ethers.constants.AddressZero;
export const getAccountFactoryContract = (
  signer?: Signer
): Contract => {
  return getReadContractByAddress(CONTRACTS.AccountFactory, ACCOUNT_FACTORY_CONTRACT, signer);
}