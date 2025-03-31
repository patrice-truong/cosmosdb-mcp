import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class MCPClient {
  private client: Client | null = null;

  private initialize = async () => {
    if (this.client) return;

    this.client = new Client(
      {
        name: "cosmosdb-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {}
        }
      }
    );

    const transport = new SSEClientTransport(
      new URL("/sse", "http://localhost:3001/"),
      {
        requestInit: {
          headers: {
            'Content-Type': 'text/event-stream',
          }
        }
      }
    );

    try {
      await this.client.connect(transport);
    } catch (e) {
      console.error('Failed to connect to MCP server:', e);
      this.client = null;
    }
  };

  getClient = async (): Promise<Client | null> => {
    await this.initialize();
    return this.client;
  };

  static create = async (): Promise<MCPClient> => {
    const instance = new MCPClient();
    await instance.initialize();
    return instance;
  };
}

export const createMCPClient = async () => {
  const mcpClient = await MCPClient.create();
  return mcpClient.getClient();
};