import fs from "node:fs/promises";
import { createClient } from "genlayer-js";
import { localnet } from "genlayer-js/chains";

const endpoint = process.env.GENLAYER_RPC_URL ?? "http://127.0.0.1:4000/api";
const contractPath = process.argv[2] ?? "contracts/ResolveMarket.py";
const code = await fs.readFile(contractPath, "utf8");

const client = createClient({
  chain: localnet,
  endpoint
});

try {
  const schema = await client.getContractSchemaForCode(code);
  console.log(JSON.stringify(schema, null, 2));
} catch (error) {
  console.error(error);
  process.exit(1);
}
