# zkSync Hardhat project

## Quick start

To have compatibility with default `.env.example` in FE, make sure you're executing this in this exact order on fresh (cleaned with `clear.sh`) [local-setup](../local-setup/README.md).

```
yarn
yarn hardhat compile
cp .env.example .env
export NODE_ENV=test ALICE_PRIVATE_KEY=0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110

# should say that deployed to address 0x111C3E89Ce80e62EE88318C2804920D4c96f92bb
yarn hardhat deploy-zksync --script deploy-paymaster.ts

# should say that deployed to address 0x4B5DF730c2e6b28E17013A1485E5d9BC41Efe021
yarn hardhat deploy-zksync --script deploy-factory.ts

# should say that deployed to address 0x26b368C3Ed16313eBd6660b72d8e4439a697Cb0B
yarn hardhat deploy-zksync --script deploy-test-token.ts
```

## Commands

- `yarn hardhat compile` will compile the contracts.
- `yarn run lint`: lint the code using solhint
- `yarn test`: run tests

## Testnet deployment

Deployed from commit 7f8f5bace3b01663ca16487b931b3e0674e3c3a6
- Paymaster: [0x7d94ea6AfA13918A05c64400338AC6622A4aCd9f](https://goerli.explorer.zksync.io/address/0x7d94ea6AfA13918A05c64400338AC6622A4aCd9f#contract)
- AccountFactory: 0xb9c88Ad991bD1836F3912bd644af8bC02b10D45F
- TestToken: [0x4A1979ff18f84155fC96f7384d34c3Eb908eDC2F](https://goerli.explorer.zksync.io/address/0x4A1979ff18f84155fC96f7384d34c3Eb908eDC2F#contract)