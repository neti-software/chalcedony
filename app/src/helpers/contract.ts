import { Contract, Signer } from "zksync-web3";
import Token from "../contracts/Token.json";

export const CONTRACTS = {
  Token,
};

const CONTRACTS_CACHE: { [key: string]: Contract } = {};

export const getReadContractByAddress = (
  contract: Contract,
  address: string,
  signer?: Signer
): Contract => {
  if (CONTRACTS_CACHE[address]) return CONTRACTS_CACHE[address];

  const contractInstance = new Contract(address, contract.abi, signer);
  CONTRACTS_CACHE[address] = contractInstance;
  return contractInstance;
};
