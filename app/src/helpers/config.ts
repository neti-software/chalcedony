export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID ?? "260";

export const RPC_ENDPOINT_URL =
  import.meta.env.VITE_RPC_ENDPOINT_URL || "https://testnet.era.zksync.dev";

export const WITNESS_DID = import.meta.env.VITE_WITNESS_DID ?? "did:ethr:0xDEED7266213c8D9674181d4bB5D4ffA10Bd2496A";

export const PAYMASTER_CONTRACT =
  import.meta.env.VITE_PAYMASTER_CONTRACT ?? "0x111C3E89Ce80e62EE88318C2804920D4c96f92bb";

export const ACCOUNT_FACTORY_CONTRACT =
  import.meta.env.VITE_ACCOUNT_FACTORY_CONTRACT ?? "0x4B5DF730c2e6b28E17013A1485E5d9BC41Efe021";

export const TEST_TOKEN_CONTRACT =
  import.meta.env.VITE_TEST_TOKEN_CONTRACT ?? "0x26b368C3Ed16313eBd6660b72d8e4439a697Cb0B"

export const WITNESS_ENDPOINT =
  import.meta.env.VITE_WITNESS_ENDPOINT ??
  "http://127.0.0.1:5000/api/v1/witness";
