/**
 * Thunder Compute MCP Proxy
 *
 * A local HTTP server that bridges Next.js (or any client) to
 * the authenticated Thunder Compute MCP server.
 *
 * Usage:
 *   npx tsx scripts/thunder-proxy.ts
 *
 * Endpoint: POST http://localhost:8765/api
 * Body: { tool: string, arguments: object }
 *
 * Example:
 *   curl -X POST http://localhost:8765/api \
 *     -H "Content-Type: application/json" \
 *     -d '{"tool":"create_instance","arguments":{"gpu_type":"a6000","template":"base"}}'
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import http from "http";

const MCP_SERVER_COMMAND = "npx";
const MCP_SERVER_ARGS = ["-y", "thunder-compute-mcp"];
const PROXY_PORT = 8765;

let mcpClient: Client | null = null;
let toolMap: Map<string, any> = new Map();

async function initMCP() {
  const transport = new StdioClientTransport({
    command: MCP_SERVER_COMMAND,
    args: MCP_SERVER_ARGS,
  });

  const client = new Client(
    { name: "thunder-proxy", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  const toolsResponse = await client.listTools();
  for (const tool of toolsResponse.tools) {
    toolMap.set(tool.name, tool);
  }

  console.log(`Connected to MCP. Available tools: ${toolsResponse.tools.map((t) => t.name).join(", ")}`);
  mcpClient = client;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const { tool, arguments: args } = JSON.parse(body);

      if (!mcpClient) {
        throw new Error("MCP client not initialized");
      }

      if (!toolMap.has(tool)) {
        throw new Error(`Unknown tool: ${tool}. Available: ${Array.from(toolMap.keys()).join(", ")}`);
      }

      console.log(`[${new Date().toISOString()}] Calling MCP tool: ${tool}`);
      const result = await mcpClient.callTool({ name: tool, arguments: args });
      console.log(`[${new Date().toISOString()}] Tool ${tool} completed`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, result }));
    } catch (err: any) {
      console.error(`Error handling request:`, err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

async function main() {
  try {
    await initMCP();
  } catch (err) {
    console.error("Failed to initialize MCP:", err);
    process.exit(1);
  }

  server.listen(PROXY_PORT, () => {
    console.log(`Thunder Compute MCP Proxy running on http://localhost:${PROXY_PORT}/api`);
    console.log("Ready for requests.");
  });
}

main();
