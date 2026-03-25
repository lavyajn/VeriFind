# VeriFind 🛡️ | Decentralized Asset Protection & Mesh Network

VeriFind is a full-stack, hybrid Web2/Web3 application designed to cryptographically verify physical asset ownership and prevent the secondary market resale of stolen goods.

It utilizes a gasless meta-transaction relayer to seamlessly bridge traditional Web2 mobile users into a secure Web3 ERC-721 ecosystem, backed by a high-speed MongoDB cache for real-time mesh network alerts.

---

## 🧠 System Architecture

The protocol separates slow, mathematically secure state changes from fast, consumer-facing UI updates:

| Layer | Technology | Role |
|-------|------------|------|
| **The Ledger** | EVM / Solidity | Ultimate source of truth for ownership and asset states (`REGISTERED`, `LOST`, `STOLEN`, `RECOVERED`) |
| **The Relayer** | Node.js | Intercepts user requests and executes blockchain state changes on their behalf using a master admin wallet, creating a frictionless, gasless experience |
| **The Indexer** | MongoDB | Simultaneously writes smart contract state changes to a centralized database |
| **The Client** | React Native | Aggressively polls the Web2 database to create a real-time Mesh Network feed of stolen devices, bypassing blockchain RPC latency and costs |

---

## 🛠️ Tech Stack

| Layer | Tools |
|-------|-------|
| **Frontend** | React Native, Expo, Axios, AsyncStorage |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB (Local / Atlas) |
| **Blockchain** | Solidity, Hardhat (Local EVM), Ethers.js v6 |
| **Storage** | IPFS via Pinata (Immutable Metadata & Image Hashing) |

---

## 📋 Prerequisites

Ensure the following are installed before getting started:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017`, or an Atlas URI)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Pinata API Keys (for IPFS uploads)

---

## ⚙️ Installation & Setup

### 1. Blockchain (Hardhat)

Start the local blockchain and deploy the smart contract.

```bash
# Terminal 1: Start the local EVM node
cd verifind/blockchain
npm install
npx hardhat node

# Terminal 2: Deploy the contract to the local node
cd verifind/blockchain
npx hardhat run scripts/deploy.js --network localhost
```

> Copy the deployed contract address from Terminal 2 — you'll need it for the backend `.env`.

---

### 2. Backend (Node.js Relayer)

Install dependencies:
```bash
cd verifind/backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/verifind
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=your_deployed_contract_address_here
```

Start the server:
```bash
node server.js
```

---

### 3. Frontend (React Native)

Install dependencies:
```bash
cd verifind/frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:5000/api
```
> Replace `192.168.x.x` with your machine's local IP address if testing on a physical device.

Start the Expo development server:
```bash
npx expo start
```

---

## 🎬 Hackathon Demo Flow

Full lifecycle demonstration of the platform's cryptographic security:

**Step 1 — Genesis Mint (Manufacturer)**
- Log in using Hardhat Account #0
- Navigate to the Mint Screen, input Account #1's address as the Initial Owner, and mint the device

**Step 2 — Cryptographic Verification**
- Log out, then log in as Account #1 (The Buyer)
- Scan the generated QR code — the app verifies the wallet signature against the smart contract and unlocks the Admin Control Panel

**Step 3 — Gasless Mesh Network Trigger**
- Tap `REPORT STOLEN` — the backend relayer pays the gas fee to update the smart contract and sync MongoDB
- Return to the Home Screen to see the polling mechanism instantly display the new BOLO (Be On the Lookout) alert

**Step 4 — Secondary Market Transfer**
- Recover the device, then transfer ownership to Account #2
- Scan the QR code again as Account #1 to demonstrate being cryptographically locked out (Read-Only Mode) due to ERC-721 token transfer

---

*Developed for the 2026 Hackathon.*
