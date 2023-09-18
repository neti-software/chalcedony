# Frontend template

What we have:

* Typescript
* [Vite](https://vitejs.dev/) for building
* [React](https://react.dev/) for FE
* [TailwindCSS](https://tailwindcss.com/) for layout + styling
* [Web3 Onboard](https://onboard.blocknative.com/docs/overview/introduction) for wallet connections
* [zkSync SDK](https://docs.zksync.io/api/sdk/js/) for chain integration
* [eslint](https://docs.zksync.io/api/sdk/) for linting
* [Vercel](https://vercel.com/) for deployment
  * [main branch deployment](https://chalcedony.vercel.app/)
  * preview deployments are created automatically for PRs - check comments in PRs left by Vercel
  
## Setup

You need Node.js v18 or newer + yarn .

## How to

* Lint: `yarn run lint`
* Run dev server: `yarn run dev`
