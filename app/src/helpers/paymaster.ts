import { utils } from "zksync-web3";
import { CONTRACTS } from "./contract";
import { BytesLike, ethers } from "ethers";
import { PAYMASTER_CONTRACT } from "./config";

export async function encodePaymasterParams(
  transactionPaidVC: any,
  proofValue: BytesLike
) {
  const encodings = new ethers.utils.Interface(CONTRACTS.IEncodings.abi);
  const paymasterInnerInput = encodings.encodeFunctionData(
    "paymasterInnerInput",
    [transactionPaidVC, proofValue]
  );
  return utils.getPaymasterParams(PAYMASTER_CONTRACT, {
    type: "General",
    innerInput: paymasterInnerInput.replace(
      encodings.getSighash("paymasterInnerInput"),
      "0x"
    ),
  });
}
