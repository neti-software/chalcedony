import { WalletState } from "@web3-onboard/core";
import { useQuery } from "react-query";
import { Signer } from "zksync-web3";
import {
  checkIsAssetCollected,
  getAllTrustedTokenBalances,
  getCustomTokenBalance,
  getERC20ContractFunctionResult,
} from "./utils";

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
    ["erc20FunctionQuery", contractAddresses, functionName, params],
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

export const useCollectedAsset = (id: string, wallet: WalletState | null) =>
  useQuery(
    ["collectedAsset", id],
    async () => checkIsAssetCollected(id, wallet),
    {
      enabled: !!(id && wallet),
    }
  );
