import { Container, CosmosClient, Database, SqlQuerySpec } from "@azure/cosmos";
import { initializeCosmosDB, validateEnvironmentVariables } from "./cosmosdb";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getEmbeddingsAsync } from "./aoai";
import { z } from "zod";

export class CosmosDBMcpServer {
  private server: McpServer;
  private client: CosmosClient;
  private database: Database;
  private productsContainer: Container;
  private ordersContainer: Container;

  private sourceFile = "src/cosmosdb-mcp-server.ts";

  constructor() {
    this.server = new McpServer(
      {
        name: "cosmosdb-mcp-server",
        version: "0.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    validateEnvironmentVariables();
    
    // Initialize Cosmos DB connection
    const { client, database, productsContainer, ordersContainer } = initializeCosmosDB();
    this.client = client;
    this.database = database;
    this.productsContainer = productsContainer;
    this.ordersContainer = ordersContainer;

    this.initializeTools();
  }

  private async searchProducts(q: string) {
    const startTime = Date.now();
    try {
      const embeddings = await getEmbeddingsAsync(q);
      if (!embeddings) {
        throw new Error("Failed to generate embeddings");
      }
      // console.debug(`[${this.sourceFile}::searchProducts] embeddings: ${embeddings}`);

      const sqlQuerySpec: SqlQuerySpec = {
        query: `
      SELECT TOP 10 
        c.id, c.type, c.brand, c.name, c.description, c.price
        FROM c
        ORDER BY VectorDistance(c.embedding, @queryEmbedding) 
      `,
        parameters: [{ name: "@queryEmbedding", value: embeddings }],
      };
      const { resources: items } = await this.productsContainer.items.query(sqlQuerySpec).fetchAll();

      const duration = Date.now() - startTime;
      console.debug(`[${this.sourceFile}::searchProducts] ${duration} ms`);

      return {
        data: items,
        statusCode: 200,
        duration: duration,
      };
    } catch (error) {
      console.timeEnd("searchProducts");
      return {
        error: "Error fetching products from Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }

  private async getOrders(email: string) {
    const startTime = Date.now();
    try {
      const sqlQuerySpec: SqlQuerySpec = {
        query: `
          SELECT *
          FROM c
          WHERE c.email = @email
          ORDER BY c.createdAt DESC
        `,
        parameters: [{ name: "@email", value: email }],
      };
      
      const { resources: items } = await this.ordersContainer.items.query(sqlQuerySpec).fetchAll();

      const duration = Date.now() - startTime;
      console.debug(`[${this.sourceFile}::getOrders] ${duration} ms`);

      return {
        data: items,
        statusCode: 200,
        duration: duration,
      };
    } catch (error) {
      return {
        error: "Error fetching orders from Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }

  private initializeTools() {

    this.server.tool(
      "Weather",
      "Get weather for a given location",
      {
        location: z.string(),
      },
      async (args, extra) => {
        return {
          content: [
            {
              type: "text",
              text: `Here is the weather in: ${args.location}!`,
            },
          ],
        };
      }
    );
    
    this.server.tool(
      "searchProducts",
      "Given a user query, search for matching products in the Azure Cosmos DB database",
      {
        query: z.string(),
      },
      async (args, extra) => {
        try {
          const { data, statusCode, duration } = await this.searchProducts(args.query);
          console.debug(`[${this.sourceFile}::searchProducts] ${duration} ms`);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Error searching for products in Cosmos DB:" + error,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
    
    this.server.tool(
      "getOrders",
      "Get all orders in the Azure Cosmos DB database for the selected email",
      {
        email: z.string(),
      },
      async (args, extra) => {
        try {
          const { data, statusCode, duration } = await this.getOrders(args.email);
          console.debug(`[${this.sourceFile}::getOrders] ${duration} ms`);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Error getting orders for selected email: " + error,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  getServer() {
    return this.server;
  }
}
