import { EIP712Signer, Signer, types, utils } from "zksync-web3";
import { CONTRACTS, getReadContractByAddress } from "./contract";
import { ethers } from "ethers";
import { encodePaymasterParams } from "./paymaster";
import { Address } from "zksync-web3/build/src/types";
import { did2address } from "./vc";
import { EIP712Service } from "@kacperzuk-neti/eip712service";

export async function transferERC20FromSmartAccount(
  tokenAddress: Address,
  inBlanco: any,
  registeredAccount: any,
  transactionPaid: any,
  signer: Signer
) {
  const recipient = await signer.getAddress();
  const smartAccountAddress = did2address(transactionPaid.vc.credentialSubject.id);
  const paymasterParams = await encodePaymasterParams(EIP712Service.onyxCredentialToEIP712Credential(transactionPaid.vc), transactionPaid.proofValue);
  const token = getReadContractByAddress(CONTRACTS.Token, tokenAddress, signer);
  const balance = await token.balanceOf(smartAccountAddress);

  const transferTx = await token.populateTransaction.transfer(recipient, balance);
  const gasLimit = (await signer.provider.estimateGas(transferTx)).add(1000000);
  const gasPrice = await signer.provider.getGasPrice();
  const chainId = (await signer.provider.getNetwork()).chainId;
  const tx = {
    ...transferTx,
    from: smartAccountAddress,
    gasLimit,
    gasPrice,
    chainId,
    nonce: await signer.provider.getTransactionCount(smartAccountAddress),
    type: 113,
    value: ethers.BigNumber.from(0),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams,
    } as types.Eip712Meta
  }

  const zksyncSigner = new EIP712Signer(signer, chainId);
  const encodings = new ethers.utils.Interface(CONTRACTS.IEncodings.abi);
  const args = [
    EIP712Service.onyxCredentialToEIP712Credential(inBlanco.vc),
    inBlanco.proofValue,
    registeredAccount.vc,
    registeredAccount.proofValue,
    ethers.utils.joinSignature(await zksyncSigner.sign(tx)),
  ];
  tx.customData.customSignature = encodings.encodeFunctionData("accountSignature", args);
  const serializedTx = utils.serialize({ ...tx });

  const sentTx = await signer.provider.sendTransaction(serializedTx);
  const receipt = await sentTx.wait();
  console.log(receipt.logs.map(l => token.interface.parseLog(l)));
}