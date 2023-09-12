# Setup

1. Install deps:
    * [Node.js](https://nodejs.org/) - CI tests on v18, but any newer should be fine too
    * [Yarn](https://yarnpkg.com/getting-started/install) - `corepack enable` should be enough to install it
    * [Docker Engine](https://docs.docker.com/engine/install/), including docker compose plugin
2. Clone repo: `git clone --recurse-submodules git@github.com:neti-software/chalcedony.git`
    * if you cloned without submodules, run `cd chalcedony && git submodule update --init` to fetch them
3. Start [zkSync dev nodes](./local-setup/README.md)
    * `cd chalcedony/local-setup && docker compose up -d`
4. Setup [our app](./app/README.md)
    * `cd chalcedony/app && yarn && yarn run dev`
5. Setup [our contracts](./contracts/README.md)
    * `cd chalcedony/contracts && yarn && yarn hardhat compile`