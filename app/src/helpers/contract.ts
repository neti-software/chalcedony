import { Contract, Provider, Signer } from "zksync-web3";
import Token from "../contracts/Token.json";

export const CONTRACTS = {
  Token,
};

const CONTRACTS_CACHE: { [key: string]: Contract } = {};

export const zkSyncProvider =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
      }
    : {
        url: "https://testnet.era.zksync.dev",
        ethNetwork: "goerli",
      };

export const getReadContractByAddress = (
  contract: Contract,
  address: string,
  signer?: Signer
): Contract => {
  if (CONTRACTS_CACHE[address]) return CONTRACTS_CACHE[address];
  const provider = signer ?? new Provider(zkSyncProvider.url);

  const contractInstance = new Contract(address, contract.abi, provider);
  CONTRACTS_CACHE[address] = contractInstance;
  return contractInstance;
};
