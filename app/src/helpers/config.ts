import { ethers } from "ethers";

export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
export const RPC_ENDPOINT_URL =
  import.meta.env.VITE_RPC_ENDPOINT_URL || "https://testnet.era.zksync.dev";
export const WITNESS_DID = import.meta.env.VITE_WITNESS_DID ?? "";
export const PAYMASTER_CONTRACT =
  import.meta.env.VITE_PAYMASTER_CONTRACT ?? ethers.constants.AddressZero;
export const ACCOUNT_FACTORY_CONTRACT =
  import.meta.env.VITE_ACCOUNT_FACTORY_CONTRACT ?? ethers.constants.AddressZero;
export const WITNESS_ENDPOINT =
  import.meta.env.VITE_WITNESS_ENDPOINT ??
  "http://127.0.0.1:5000/api/v1/witness";
