import {
  EthrDIDMethod,
  PROOF_OF_NAME,
  createCredential,
} from "@jpmorganchase/onyx-ssi-sdk";
import { EIP712Service } from "../src";
import { constants } from "ethers";

const main = async () => {
  const didKey = new EthrDIDMethod({
    name: "anvil",
    rpcUrl: "http://localhost:8545",
    registry: constants.AddressZero,
  });

  const issuerKeyDid = await didKey.create();

  //subject DID and data
  const subjectDID = await didKey.create();
  const subjectData = {
    name: "Ollie",
  };

  //create VC from subject data
  const vc = await createCredential(
    issuerKeyDid.did,
    subjectDID.did,
    subjectData,
    [PROOF_OF_NAME],
    { id: "banana", expirationDate: "dfdf" }
  );

  //create credential options
  const vcTypes = {
    CredentialSubject: [
      { name: "id", type: "string" },
      { name: "name", type: "string" },
    ],
    Issuer: [{ name: "id", type: "string" }],
  };

  //Use JWT signing service to sign the VC with the issuer keys
  const eip712Service = new EIP712Service({
    name: "Krebit",
    version: "0.1",
    chainId: 4,
    verifyingContract: "0xa533e32144b5be3f76446f47696bbe0764d5339b",
  });
  const eip712 = await eip712Service.signVC(issuerKeyDid, vc, vcTypes);
  console.log(eip712);
};
main();
