import { Container, CosmosClient, SqlQuerySpec } from "@azure/cosmos";

import { Cart } from "@/models/cart";
import { DefaultAzureCredential } from "@azure/identity";

const sourceFile: string = "lib/cosmosdb.ts";

export class CosmosDBService {
  private client: CosmosClient;
  public database: any;
  public cartsContainer: Container;
  public productsContainer: Container;
  public ordersContainer: Container; // Add this line

  constructor() {
    const endpoint = process.env.AZURE_COSMOSDB_NOSQL_ENDPOINT as string;
    const databaseId = process.env.AZURE_COSMOSDB_NOSQL_DATABASE as string;
    const productsContainerId = process.env.AZURE_COSMOSDB_NOSQL_PRODUCTS_CONTAINER as string;
    const cartsContainerId = process.env.AZURE_COSMOSDB_NOSQL_CARTS_CONTAINER as string;
    const ordersContainerId = process.env.AZURE_COSMOSDB_NOSQL_ORDERS_CONTAINER as string;

    const credential = new DefaultAzureCredential();

    this.client = new CosmosClient({
      endpoint: endpoint,
      aadCredentials: credential,
    });

    this.database = this.client.database(databaseId);
    this.cartsContainer = this.database.container(cartsContainerId);
    this.productsContainer = this.database.container(productsContainerId);
    this.ordersContainer = this.database.container(ordersContainerId);
  }

  async storeCart(cart: Cart) {
    try {
      const sqlQuerySpec: SqlQuerySpec = {
        query: "SELECT TOP 1 * FROM c WHERE c.userName = @userName",
        parameters: [
          {
            name: "@userName",
            value: cart.userName,
          },
        ],
      };
      const { resources: items } = await this.cartsContainer.items.query(sqlQuerySpec).fetchAll();

      if (items.length > 0) {
        const existingCart = items[0];
        existingCart.items = cart.items;
        this.cartsContainer.items.upsert(existingCart);
      } else {
        this.cartsContainer.items.upsert(cart);
      }

      return {
        data: items,
        statusCode: 200,
      };
    } catch (error) {
      return {
        error: "Error storing cart in Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }

  async loadCart(userName: string) {
    try {
      const sqlQuerySpec: SqlQuerySpec = {
        query: "SELECT TOP 1 * FROM c WHERE c.userName = @userName",
        parameters: [
          {
            name: "@userName",
            value: userName,
          },
        ],
      };
      const { resources: items } = await this.cartsContainer.items.query(sqlQuerySpec).fetchAll();

      return {
        data: items,
        statusCode: 200,
      };
    } catch (error) {
      return {
        error: "Error loading cart from Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }

  async getProducts() {
    const startTime = Date.now();
    try {
      const query = `SELECT c.id, c.type, c.brand, c.name, c.description, c.price FROM c`;
      const sqlQuerySpec: SqlQuerySpec = {
        query: query,
      };
      const { resources: items } = await this.productsContainer.items.query(sqlQuerySpec).fetchAll();

      const duration = Date.now() - startTime;
      console.debug(`[${sourceFile}] getProducts: ${duration} ms`);

      return {
        data: items,
        statusCode: 200,
        duration: duration,
      };
    } catch (error) {
      return {
        error: "Error fetching products from Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }

  async createOrder(cart: Cart) {
    const startTime = Date.now();
    try {
      const order = {
        id: Date.now().toString(),
        items: cart.items,
        userName: cart.userName,
        total: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      const { resource } = await this.ordersContainer.items.create(order);

      const duration = Date.now() - startTime;
      console.debug(`[${sourceFile}] createOrder: ${duration} ms`);

      return {
        data: resource,
        statusCode: 200,
        duration: duration,
      };
    } catch (error) {
      return {
        error: "Error creating order in Cosmos DB: " + error,
        statusCode: 500,
      };
    }
  }
}

// Create a singleton instance
export const cosmosDBService = new CosmosDBService();
