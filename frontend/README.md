# Frontend - Decentralized Rental Platform

This directory contains the Next.js frontend application for the Decentralized Rental Platform.

## Technology Stack

*   **Next.js:** React framework for building user interfaces.
*   **React:** JavaScript library for building UIs.
*   **TypeScript:** Superset of JavaScript adding static types.
*   **ethers.js:** Library for interacting with the Ethereum blockchain and smart contracts.
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **shadcn/ui:** Re-usable UI components built using Radix UI and Tailwind CSS.
*   **Pinata SDK:** For interacting with the Pinata IPFS service.
*   **Sonner:** Toast notifications for user feedback.
*   **Framer Motion:** For animations.

## Prerequisites

*   All prerequisites from the root `README.md` (Node.js, npm/yarn, Git).
*   **MetaMask:** Browser extension wallet is required to interact with the dApp. [Install MetaMask](https://metamask.io/download/)

## Project Setup (Frontend)

1.  **Navigate to Frontend Directory:**
    From the project root:
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    If you haven't already installed dependencies from the root directory, you might need to install them specifically for the frontend (though root `npm install` or `yarn install` should typically handle workspaces if configured):
    ```bash
    npm install
    # or: yarn install
    ```

3.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the `frontend` directory.
    *   Add the following variables:
        ```dotenv
        # frontend/.env.local
        PINATA_API_KEY=<YOUR_PINATA_API_KEY>
        PINATA_API_SECRET=<YOUR_PINATA_API_SECRET>
        NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
        ```
    *   **`PINATA_API_KEY` / `PINATA_API_SECRET`**: Your API credentials from [Pinata.cloud](https://pinata.cloud). These are used by the backend API route (`/api/upload`) for pinning files to IPFS.
    *   **`NEXT_PUBLIC_IPFS_GATEWAY`**: The public gateway URL used to fetch IPFS content in the browser. The Pinata gateway is a common choice.

4.  **Configure Smart Contract Addresses & ABIs:**
    *   After deploying your smart contracts (see root `README.md`), you need to update the frontend with the correct addresses and ABIs.
    *   **Addresses:** Update the addresses in `frontend/lib/config.ts` with the addresses printed during contract deployment.
    *   **ABIs:** Copy the latest compiled contract JSON files (e.g., `PropertyListing.json`, `RentalAgreement.json`, `Escrow.json`) from the root `artifacts/contracts/YourContract.sol/` directory into the `frontend/lib/abi/` directory, replacing the existing files.

## Running the Frontend (Local Development)

1.  **Ensure Backend is Ready:**
    *   Make sure Ganache is running.
    *   Make sure your contracts have been deployed to Ganache, and the addresses/ABIs in the frontend config/libs are up-to-date.

2.  **Start the Frontend Development Server:**
    From the `frontend` directory:
    ```bash
    npm run dev
    # or: yarn dev
    ```

3.  **Open the Application:**
    Open your browser and navigate to `http://localhost:3000` (or the port specified in the console).

4.  **Connect Wallet:**
    *   Make sure MetaMask is installed and unlocked.
    *   Ensure MetaMask is connected to your **local Ganache network**. You might need to add Ganache as a custom network in MetaMask (Network Name: Ganache, RPC URL: `http://127.0.0.1:7545`, Chain ID: `1337`, Currency Symbol: ETH).
    *   Use the "Connect Wallet" button in the application's navbar.
    *   Import one or more Ganache accounts (using their private keys) into MetaMask so you can interact with the dApp (list properties, rent, etc.).

## Building for Production

From the `frontend` directory:
```bash
npm run build
# or: yarn build
```

To start the production server:
```bash
npm run start
# or: yarn start
```

## Project Structure (Frontend)

```
frontend/
├── app/                  # Next.js App Router directory (pages, layouts, API routes)
│   ├── (routes)/         # Page route directories (e.g., list-property, my-properties)
│   ├── api/              # API route handlers (e.g., /api/upload)
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Homepage
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── property-card.tsx # Example custom component
│   └── web3-provider.tsx # Context provider for Web3 state
├── hooks/                # Custom React hooks (e.g., use-toast)
├── lib/                  # Libraries, utilities, configuration
│   ├── abi/              # Contract ABIs (JSON files)
│   ├── config.ts         # Contract addresses, network config
│   └── utils.ts          # Utility functions
├── public/               # Static assets (images, fonts)
├── styles/               # Additional style files (if any)
├── types/                # TypeScript type definitions
├── .env.local          # Environment variables (Gitignored)
├── components.json       # shadcn/ui configuration
├── next.config.mjs       # Next.js configuration
├── package.json          # Frontend dependencies and scripts
├── postcss.config.mjs    # PostCSS configuration
├── README.md             # This file
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
``` 
