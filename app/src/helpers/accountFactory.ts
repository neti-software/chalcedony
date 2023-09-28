import { DIDWithKeys, EthrDIDMethod } from "@jpmorganchase/onyx-ssi-sdk";
import { Contract, ethers } from "ethers";
import { CONTRACTS, getAccountFactoryContract, getReadContractByAddress } from "./contract";
import { Signer, utils } from "zksync-web3";

const WITNESS_DID = import.meta.env.VITE_WITNESS_DID ?? "";
export async function createSmartAccount(alice: Signer): Promise<{ did: DIDWithKeys, contract: Contract}> {
  const ethr = new EthrDIDMethod({
    name: "",
    rpcUrl: "",
    registry: ethers.constants.AddressZero,
  });
  const did = await ethr.create();
  const factory = getAccountFactoryContract(alice);
  const salt = ethers.utils.randomBytes(32);
  const tx = await factory.deployAccount(salt, did.did, WITNESS_DID);
  await tx.wait();
  const abiCoder = new ethers.utils.AbiCoder();
  const address = utils.create2Address(
    factory.address,
    await factory.bytecodeHash(),
    salt,
    abiCoder.encode(["string", "string"], [did.did, WITNESS_DID])
  );
  const contract = getReadContractByAddress(CONTRACTS.Account, address, alice);
  return {
    did,
    contract,
  }
}