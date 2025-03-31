import { CosmosClient } from '@azure/cosmos'
import { DefaultAzureCredential } from '@azure/identity'

const sourceFile = 'src/cosmosdb.ts'

export function validateEnvironmentVariables () {
  const required = [
    'AZURE_COSMOSDB_NOSQL_ENDPOINT',
    'AZURE_COSMOSDB_NOSQL_DATABASE',
    'AZURE_COSMOSDB_NOSQL_PRODUCTS_CONTAINER',
    'AZURE_COSMOSDB_NOSQL_CARTS_CONTAINER'
  ]

  for (const variable of required) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`)
    }
  }
}

export const initializeCosmosDB = () => {
  const endpoint = process.env.AZURE_COSMOSDB_NOSQL_ENDPOINT as string
  const databaseId = process.env.AZURE_COSMOSDB_NOSQL_DATABASE as string
  const productsContainerId = process.env
    .AZURE_COSMOSDB_NOSQL_PRODUCTS_CONTAINER as string
  const cartsContainerId = process.env
    .AZURE_COSMOSDB_NOSQL_CARTS_CONTAINER as string
    const ordersContainerId = process.env
    .AZURE_COSMOSDB_NOSQL_ORDERS_CONTAINER as string

  const credential = new DefaultAzureCredential()

  console.debug(
    `[${sourceFile}::initializeCosmosDB] Cosmos DB endpoint: ${endpoint}`
  )
  console.debug(
    `[${sourceFile}::initializeCosmosDB] Cosmos DB products container: ${productsContainerId}`
  )
  console.debug(
    `[${sourceFile}::initializeCosmosDB] Cosmos DB carts container: ${cartsContainerId}`
  )
  console.debug(
    `[${sourceFile}::initializeCosmosDB] Cosmos DB orders container: ${ordersContainerId}`
  )

  const client = new CosmosClient({
    endpoint: endpoint,
    aadCredentials: credential
  })

  const database = client.database(databaseId)
  const productsContainer = database.container(productsContainerId)
  const ordersContainer = database.container(ordersContainerId)

  return { client, database, productsContainer, ordersContainer }
}
