# Deploy ResolveMarket

These commands assume npm is installed and the GenLayer CLI is available. If the CLI command names differ in your installed version, follow the current GenLayer CLI help and keep the same contract file and constructor args.

## Studionet / local Studio

```bash
genlayer init
genlayer studio
genlayer deploy contracts/ResolveMarket.py --network studionet
```

Copy the deployed contract address into `.env.local`:

```bash
NEXT_PUBLIC_NETWORK=studionet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_OWNER_ADDRESS=0x...
```

## Testnet Bradbury

```bash
genlayer login
genlayer deploy contracts/ResolveMarket.py --network testnet-bradbury
```

Configure Vercel with:

```bash
NEXT_PUBLIC_NETWORK=bradbury
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_OWNER_ADDRESS=0x...
NEXT_PUBLIC_FAUCET_URL=https://testnet-faucet.genlayer.foundation
```

## Seed markets

Use `/admin` after deployment. The owner wallet must match `NEXT_PUBLIC_OWNER_ADDRESS`.
