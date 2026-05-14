#!/usr/bin/env node
/**
 * thunder-run — Bridge from Next.js to Thunder Compute MCP
 *
 * Usage:
 *   npx tsx scripts/thunder-run.ts <tool> '<JSON arguments>'
 *
 * Example:
 *   npx tsx scripts/thunder-run.ts list_instances '{}'
 *   npx tsx scripts/thunder-run.ts create_instance '{"gpu_type":"a6000","template":"base"}'
 *
 * Reads the MCP server config from the current Claude session context.
 * Stdout is the JSON result (for parsing by the caller).
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

const MCP_SERVER_PATH = findMCPServerPath();
const TOOL = process.argv[2];
const ARGS_JSON = process.argv[3] || "{}";

function findMCPServerPath(): string {
  // Try to locate the thunder-compute MCP server
  // It may be a global npx package or local
  const candidates = [
    path.resolve("node_modules/.bin/tnr-mcp"),
    path.resolve("node_modules/tnr-mcp/dist/index.js"),
    "tnr-mcp",   // global npx
  ];
  for (const c of candidates) {
    if (c.startsWith("/") && existsSync(c)) return c;
  }
  return "tnr-mcp"; // fallback — let shell resolve
}

async function main() {
  if (!TOOL) {
    console.error("Usage: npx tsx scripts/thunder-run.ts <tool> '<JSON args>'");
    console.error("Example: npx tsx scripts/thunder-run.ts list_instances '{}'");
    process.exit(1);
  }

  let args: Record<string, any>;
  try {
    args = JSON.parse(ARGS_JSON);
  } catch (e) {
    console.error("Invalid JSON arguments:", e);
    process.exit(1);
  }

  // Figure out what command to run
  const cmd = MCP_SERVER_PATH;
  const cmdArgs: string[] = cmd === "tnr-mcp" ? [] : [];

  const transport = new StdioClientTransport({
    command: cmd.startsWith("/") ? cmd : "npx",
    args: cmd.startsWith("/") ? cmdArgs : ["-y", "tnr-mcp"],
  });

  const client = new Client(
    { name: "thunder-run", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    const result = await client.callTool({ name: TOOL, arguments: args });
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("Tool call failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
