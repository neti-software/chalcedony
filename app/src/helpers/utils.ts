import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "zksync-web3";
import { RPC_ENDPOINT_URL } from "./config";
import { CONTRACTS, getReadContractByAddress } from "./contract";

type Balances = {
  [key: string]: BigNumber | string;
};

export const getAllTrustedTokenBalances = async (
  walletAddress: string
): Promise<Balances> => {
  const response = await fetch(RPC_ENDPOINT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "zks_getAllAccountBalances",
      params: [walletAddress],
    }),
  });

  const { result } = await response.json();

  return result;
};

export const getCustomTokenBalance = async (
  walletAddress: string,
  contractAddresses: Array<string>,
  signer?: Signer
): Promise<Balances> => {
  const promisses = contractAddresses.map((contractAddress: string) => {
    const tokenContract = getReadContractByAddress(
      CONTRACTS.Token as any,
      contractAddress,
      signer
    );

    return tokenContract.balanceOf(walletAddress);
  });

  const balances = await Promise.all(promisses);

  let result: Balances = {};

  for (let index = 0; index < balances.length; index++) {
    const balance = balances[index];
    result = { ...result, [contractAddresses[index]]: balance };
  }

  return result;
};

export const getERC20ContractFunctionResult = async (
  contractAddresses: Array<string>,
  functionName: string,
  signer?: Signer,
  params: Array<string> = []
): Promise<any> => {
  const promisses = contractAddresses.map((contractAddress: string) => {
    const tokenContract = getReadContractByAddress(
      CONTRACTS.Token as any,
      contractAddress,
      signer
    );

    return tokenContract[functionName](...params);
  });

  const contractResults = await Promise.all(promisses);

  let result: any = {};

  for (let index = 0; index < contractResults.length; index++) {
    const balance = contractResults[index];
    result = { ...result, [contractAddresses[index]]: balance };
  }

  return result;
};
