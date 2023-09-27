import { useQuery } from "react-query";
import {
  getAllTrustedTokenBalances,
  getCustomTokenBalance,
  getERC20ContractFunctionResult,
} from "./utils";
import { Signer } from "zksync-web3";

export const useGetTrustedTokenBalances = (walletAddress: string) =>
  useQuery(
    ["trustedTokenBalances", walletAddress],
    async () => getAllTrustedTokenBalances(walletAddress),
    {
      enabled: !!walletAddress,
    }
  );

export const useGetCustomTokenBalance = (
  walletAddress: string,
  contractAddresses: Array<string>,
  signer?: Signer
) =>
  useQuery(
    ["customTokenBalance", walletAddress],
    async () => getCustomTokenBalance(walletAddress, contractAddresses, signer),
    {
      enabled: !!(walletAddress && contractAddresses),
    }
  );

export const useERC20Function = (
  contractAddresses: Array<string>,
  functionName: string,
  params: Array<string | undefined> = [],
  signer?: Signer
) =>
  useQuery(
    ["testQuery", contractAddresses, functionName],
    async () =>
      getERC20ContractFunctionResult(
        contractAddresses,
        functionName,
        signer,
        params
      ),
    {
      enabled: !!(contractAddresses && functionName && params),
    }
  );
