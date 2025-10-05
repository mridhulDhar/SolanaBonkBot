# BonkBot - Solana Wallet & Transaction Management API

A secure backend service for managing Solana wallets and transactions on the Solana blockchain. Built with Express.js, TypeScript, and Prisma.

## Project Description

BonkBot is a RESTful API that provides comprehensive wallet management and transaction services for the Solana blockchain. It handles user authentication, wallet creation with encrypted private key storage, balance checking, airdrops, and SOL transfers. The service uses JWT authentication and stores all data securely using Prisma ORM.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Wallet Management**: Automatic wallet creation with encrypted private key storage
- **Balance Checking**: Real-time SOL balance retrieval from Solana blockchain
- **Airdrops**: Request test SOL on devnet
- **Transfers**: Send SOL to other addresses with transaction tracking
- **Transaction History**: Track and monitor transaction status

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Blockchain**: Solana Web3.js
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user and automatically create a Solana wallet.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "user created",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "wallet": "solana_public_key"
  }
}
```

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "logged in",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "wallet": "solana_public_key"
  }
}
```

---

### Wallet (`/api/wallet`)

All wallet endpoints require authentication. Include JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

#### GET `/api/wallet/info`
Get wallet information and current SOL balance.

**Response:**
```json
{
  "publicKey": "solana_public_key",
  "balance": 1.5
}
```

#### POST `/api/wallet/airdrop`
Request SOL airdrop on devnet.

**Request Body:**
```json
{
  "amount": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Airdrop of 1 successful",
  "signature": "transaction_signature",
  "publicKey": "solana_public_key"
}
```

---

### Transactions (`/api/transaction`)

All transaction endpoints require authentication.

#### POST `/api/transaction/send`
Send SOL to another address.

**Request Body:**
```json
{
  "toAddress": "recipient_solana_address",
  "amount": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "db_transaction_id",
  "signature": "blockchain_signature",
  "status": "confirmed",
  "amount": 0.5,
  "toAddress": "recipient_address"
}
```

#### GET `/api/transaction/status/:transactionId`
Get detailed status of a transaction.

**Response:**
```json
{
  "id": "transaction_id",
  "status": "CONFIRMED",
  "signature": "blockchain_signature",
  "type": "TRANSFER",
  "amount": "0.5",
  "token": "SOL",
  "fromAddress": "sender_address",
  "toAddress": "recipient_address",
  "fee": "0.000005",
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "confirmedAt": "2024-01-01T00:00:01.000Z",
  "onChainStatus": {
    "slot": 123456,
    "confirmation": "finalized",
    "blockTime": 1704067201
  }
}
```

---

## Service Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                              │
│                    (Express.js Router)                           │
└─────┬──────────────┬─────────────────┬─────────────────────────┘
      │              │                 │
      ▼              ▼                 ▼
┌──────────┐  ┌──────────┐      ┌──────────────┐
│   Auth   │  │  Wallet  │      │ Transaction  │
│  Routes  │  │  Routes  │      │   Routes     │
└────┬─────┘  └────┬─────┘      └──────┬───────┘
     │             │                    │
     │             │                    │
     ▼             ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION MIDDLEWARE                     │
│                    (JWT Token Validation)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet     │  │    Crypto    │  │   Database   │          │
│  │   Service    │  │   Service    │  │   (Prisma)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
│  Solana Network  │ │  Encryption  │ │    Database    │
│   (Web3.js)      │ │  (AES-256)   │ │  (SQLite/PG)   │
└──────────────────┘ └──────────────┘ └────────────────┘
```

## Security Features

- **Encrypted Private Keys**: All private keys are encrypted using AES-256-GCM
- **Password Hashing**: User passwords hashed with bcrypt (10 rounds)
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation on all endpoints
- **Transaction Tracking**: Complete audit trail of all transactions

---

## License

MIT
