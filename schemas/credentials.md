# Verifiable credentials

All VCs has following basic schema (TODO: write formal schema):

```json
{
    _context: ["https://www.w3.org/ns/credentials/v2"],
    id: "did:ethr:0xbaad",
    _type: ["VerifiableCredential", "MyCred"],
    issuer: {
        id: "did:ethr:0xdeadbeaf"
    },
    credentialSubject: {
        id: "did:ethr:0xc00ffebabe"
    }
}
```

Where:
* `_context` is equivalent to standard [`@_context`](https://www.w3.org/TR/vc-data-model/#_contexts)
* [`id`](https://www.w3.org/TR/vc-data-model/#identifiers) is a DID of the VC itself
* `_type` is equivalent to standard [`type`](https://www.w3.org/TR/vc-data-model/#types)
* [`issuer`](https://www.w3.org/TR/vc-data-model/#issuer) is a DID of the VC issuer
* [`credentialSubject`](https://www.w3.org/TR/vc-data-model/#credential-subject) describes the subject and contains:
  * `id` is a DID of the VC subject
  * any number of specific claims (depends on `_type`)

Although we present VCs as JSON in this document, they're actually EIP-712 TypedStructs.

## VC Types

### `InBlancoAccountController`

This type contains claim that given subject can control issuer's Smart Account. In our case, issuer is always equal to the subject.

```json
{
    _context: ["https://www.w3.org/ns/credentials/v2"],
    id: "did:ethr:0xbaad",
    _type: ["VerifiableCredential", "InBlancoAccountController"],
    issuer: {
        id: "did:ethr:0xdeadbeaf"
    },
    credentialSubject: {
        id: "did:ethr:0xdeadbeaf"
    }
}
```

### `TransactionPaid`

This type contains claim that given subject (a Smart Account) can pay for a single transaction using funds deposited by issuer in the paymaster.

```json
{
    _context: ["https://www.w3.org/ns/credentials/v2"],
    id: "did:ethr:0xbaad",
    _type: ["VerifiableCredential", "TransactionPaid"],
    issuer: {
        id: "did:ethr:0xc0febabe"
    },
    credentialSubject: {
        id: "did:ethr:0xdeadbeaf"
    }
}
```

### `RegisteredAccountController`

This type contains claim that given subject (Bob's new wallet) registered as the new controller of a Smart Account. Issued by our backend based on `InBlancoAccountController`.

```json
{
    _context: ["https://www.w3.org/ns/credentials/v2"],
    id: "did:ethr:0xbaad",
    _type: ["VerifiableCredential", "RegisteredAccountController"],
    issuer: {
        id: "did:ethr:0xbaadb10c"
    },
    credentialSubject: {
        id: "did:ethr:0x00ff00ff",
        registeredWith: {
            id: "did:ethr:0xbaad"
        }
    }
}
```

## Full lifecycle

Actors:
* Alice - person that wants to send assets
* Bob - person that will receive assets
* Backend - service that issues `RegisteredAccountController` VCs to prevent front-running / replay attacks


1. Alice generates a DID for Smart Account.
2. Alice creates Smart Account on chain.
3. Alice creates an `InBlancoAccountController` VC:
   * Issuer - Smart Account DID
   * Subject - Smart Account DID
4. Alice deposits ETH in Paymaster.
5. Alice creates an `TransactionPaid` VC:
   * Issuer - Alice `did:ethr:` DID
   * Subject - Smart Account DID
6. Alice sends both VCs over to Bob
7. Bob takes `InBlancoAccountController` VC and shows it + his new wallet address to the Backend
8. Backend verifies the VC and that it was never used before and it issues `RegisteredAccountController` VC and gives it to Bob:
   * Issuer - Backend DID
   * Subject - Bob's wallet
9.  Bob sends all VCs + his transaction to the chain
10. Smart Account verifies that:
  * Tx is signed somehow with EOA
  * `InBlancoAccountController`:
    * issuer matches subject matches the Smart Account
    * signature is valid
  * `RegisteredAccountController`:
    * issuer matches configured backend DID
    * subject matches the Tx signer
    * signature is valid
    * registeredWith matches the `InBlancoAccountController`
11. Paymaster verifies that:
    * `TransactionPaid`:
      * Issuer - can be anyone, but needs enough balance in paymaster to cover the fee
      * Subject - matches the Smart Account
      * signature is valid
      * DID of this VC wasn't used before