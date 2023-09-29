# Setup

1. Install deps:
    * [Node.js](https://nodejs.org/) - CI tests on v18, but any newer should be fine too
    * [Yarn](https://yarnpkg.com/getting-started/install) - `corepack enable` should be enough to install it
    * [Docker Engine](https://docs.docker.com/engine/install/), including docker compose plugin
2. Clone repo: `git clone --recurse-submodules git@github.com:neti-software/chalcedony.git`
    * if you cloned without submodules, run `cd chalcedony && git submodule update --init` to fetch them
3. Build [chalcedony-vcs](./chalcedony-vcs/README.md) library:
    * `cd chalcedony/chalcedony-vcs && yarn && yarn tsc`
3. Build [EIP712Service](./EIP712Service/README.md) library:
    * `cd chalcedony/EIP712Service && yarn && yarn tsc`
3. Start [zkSync dev nodes](https://github.com/matter-labs/local-setup/blob/main/README.md)
    * `cd chalcedony/local-setup && docker compose up -d`
4. Setup [our frontend app](./app/README.md)
    * `cd chalcedony/app && cp .env.example .env && yarn && yarn run dev`
4. Setup [our backend app](./witness-backend/README.md)
    * `cd chalcedony/witness-backend && yarn && yarn run dev`
5. Setup [our contracts](./contracts/README.md)
    * follow Quick start guide in linked README.md

`main` is automatically deployed to https://chalcedony.vercel.app/
