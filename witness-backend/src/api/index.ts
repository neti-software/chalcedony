import express from 'express';
import { VC, RegisteredAccountControllerCredentialSubject, RegistrationClaim, Issuer } from 'chalcedony-vcs';
import { Wallet } from 'ethers';

const router = express.Router();

const burnedVCs: {
  [key: string]: boolean
} = {};

const privKey = '0x4906ff9bd0aadfe2923e126c1d20bbdc606934282526ce6b856ff09b2ef0603a';

router.post('/witness', async (req, res, next) => {
  try {
    if (!req.body.inBlancoVCId) throw new Error('Missing inBlancoVCId');
    if (!req.body.subjectId) throw new Error('Missing subjectId');
    if (!req.body.domainSeparator) throw new Error('Missing domainSeparator');

    if (burnedVCs[req.body.inBlancoVCId]) throw new Error('Burned inBlancoVC!');
    burnedVCs[req.body.inBlancoVCId] = true;

    const { address: vcAddr } = Wallet.createRandom();
    const signer = new Wallet(privKey);
    const vc = new VC(
      ['https://www.w3.org/ns/credentials/v2'],
      `did:ethr:${vcAddr}`,
      ['VerifiableCredential', 'RegisteredAccountController'],
      new Issuer(`did:ethr:${signer.address}`),
      new RegisteredAccountControllerCredentialSubject(
        req.body.subjectId,
        new RegistrationClaim(req.body.inBlancoVCId),
      ),
    );
    const proofValue = await vc.sign(signer, req.body.domainSeparator);

    res.json({ vc, proofValue });
  } catch (e) {
    next(e);
  }
});

export default router;
