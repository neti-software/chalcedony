import { EIP712Service } from "@kacperzuk-neti/eip712service";
import { ethers } from "ethers";
import { EIP712Signer, Provider, Signer, types, utils } from "zksync-web3";
import { Address } from "zksync-web3/build/src/types";
import { CONTRACTS, getWriteContractByAddress } from "./contract";
import { encodePaymasterParams } from "./paymaster";
import { did2address } from "./vc";
import { RPC_ENDPOINT_URL } from "./config";

export async function transferERC20FromSmartAccount(
  tokenAddress: Address,
  inBlanco: any,
  registeredAccount: any,
  transactionPaid: any,
  signer: Signer
) {
  const provider = new Provider(RPC_ENDPOINT_URL, 'any');
  const recipient = await signer.getAddress();
  const smartAccountAddress = did2address(
    transactionPaid.vc.credentialSubject.id
  );
  const paymasterParams = await encodePaymasterParams(
    EIP712Service.onyxCredentialToEIP712Credential(transactionPaid.vc),
    transactionPaid.proofValue
  );
  const token = getWriteContractByAddress(
    CONTRACTS.Token,
    tokenAddress,
    signer
  );
  const balance = await token.balanceOf(smartAccountAddress);

  const transferTx = await token.populateTransaction.transfer(
    recipient,
    balance
  );
  const gasPrice = await signer.provider.getGasPrice();
  const chainId = (await signer.provider.getNetwork()).chainId;
  const tx = {
    ...transferTx,
    from: smartAccountAddress,
    gasLimit: 500000,
    gasPrice,
    chainId,
    nonce: await signer.provider.getTransactionCount(smartAccountAddress),
    type: 113,
    value: ethers.BigNumber.from(0),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams,
    } as types.Eip712Meta,
  };

  const zksyncSigner = new EIP712Signer(signer, chainId);
  const encodings = new ethers.utils.Interface(CONTRACTS.IEncodings.abi);
  const args = [
    EIP712Service.onyxCredentialToEIP712Credential(inBlanco.vc),
    inBlanco.proofValue,
    registeredAccount.vc,
    registeredAccount.proofValue,
    ethers.utils.joinSignature(await zksyncSigner.sign(tx)),
  ];
  tx.customData.customSignature = encodings.encodeFunctionData(
    "accountSignature",
    args
  );
  const serializedTx = utils.serialize({ ...tx });

  const sentTx = await provider.sendTransaction(serializedTx);
  if(window.ethereum)
    await window.ethereum.request({
      "method": "wallet_watchAsset",
      "params": {
        "type": "ERC20",
        "options": {
          "address": token.address,
          "symbol": await token.symbol(),
          "decimals": await token.decimals(),
        }
      }
    });
  await sentTx.wait();
}
