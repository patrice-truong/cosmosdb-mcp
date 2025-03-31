using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Identity;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Fluent;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

internal class Program
{
    private static string AzureOpenAIEndpoint;
    private static string EmbeddingModel;
    private static readonly HttpClient httpClient = new HttpClient();

    private static async Task Main(string[] args)
    {
        // Build configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .Build();

        #region Get settings from appsettings.json and validate inputs
        // Read AzureOpenAI settings from configuration
        var azureOpenAISettings = configuration.GetSection("AzureOpenAI");
        string AzureOpenAIUrl =
            azureOpenAISettings["Endpoint"]
            ?? throw new ArgumentNullException("Azure OpenAI Endpoint cannot be null");
        if (AzureOpenAIUrl == "https://<azure_openai_account>.openai.azure.com")
        {
            throw new ArgumentException(
                "Azure OpenAI Endpoint must be configured with a valid value in appsettings.json"
            );
        }
        string AzureOpenAIApiKey =
            azureOpenAISettings["Key"]
            ?? throw new ArgumentNullException("Azure OpenAI Key cannot be null");
        if (AzureOpenAIApiKey == "<azure_openai_key>")
        {
            throw new ArgumentException(
                "Azure OpenAI Key must be configured with a valid value in appsettings.json"
            );
        }

        string AzureOpenAIApiVersion =
            azureOpenAISettings["ApiVersion"]
            ?? throw new ArgumentNullException("Azure OpenAI API Version cannot be null");

        EmbeddingModel =
            azureOpenAISettings["EmbeddingModel"]
            ?? throw new ArgumentNullException("Azure OpenAI Embedding model cannot be null");

        // Read Cosmos DB settings from configuration
        var cosmosDbSettings = configuration.GetSection("CosmosDb");
        string endpoint =
            cosmosDbSettings["Endpoint"]
            ?? throw new ArgumentNullException("Endpoint cannot be null");
        if (endpoint == "https://<cosmosdb_account_name>.documents.azure.com:443/")
        {
            throw new ArgumentException(
                "Cosmos DB AEndpoint must be configured with a valid value in appsettings.json"
            );
        }
        string tenantId =
            cosmosDbSettings["TenantId"]
            ?? throw new ArgumentNullException("TenantId cannot be null");
        if (tenantId == "<tenant_id>")
        {
            throw new ArgumentException(
                "TenantId must be configured with a valid value in appsettings.json"
            );
        }
        string databaseName =
            cosmosDbSettings["DatabaseName"]
            ?? throw new ArgumentNullException("DatabaseName cannot be null");
        string containerName =
            cosmosDbSettings["ProductsContainerName"]
            ?? throw new ArgumentNullException("ProductsContainerName cannot be null");

        #endregion

        // Set Azure OpenAI endpoint
        AzureOpenAIEndpoint =
            $"{AzureOpenAIUrl}/openai/deployments/{EmbeddingModel}/embeddings?api-version={AzureOpenAIApiVersion}";
        Console.WriteLine(AzureOpenAIEndpoint);
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            AzureOpenAIApiKey
        );

        // Create Cosmos DB client
        var credentialOptions = new DefaultAzureCredentialOptions
        {
            TenantId = tenantId,
            Diagnostics = { IsLoggingEnabled = true },
        };

        var credential = new DefaultAzureCredential(credentialOptions);
        CosmosClientBuilder builder = new(endpoint, credential);

        // Create Cosmos DB client
        using CosmosClient client = builder.Build();

        // Create database if it does not exist
        Console.WriteLine($"Creating database {databaseName} if it does not exist");
        Database database = await client.CreateDatabaseIfNotExistsAsync(databaseName);

        // Create container if it does not exist
        Console.WriteLine($"Creating container {containerName} if it does not exist");
        Container container = await database.CreateContainerIfNotExistsAsync(containerName, "/id");

        // Read JSON file and deserialize to list of products
        Console.WriteLine("Reading JSON file and deserializing to list of products");
        string jsonFilePath = "catalog.json";
        string jsonString = File.ReadAllText(jsonFilePath);
        var products = JsonConvert.DeserializeObject<List<Product>>(jsonString) ?? [];

        Stopwatch stopwatch = new();

        stopwatch.Restart();
        Console.WriteLine("Populating Cosmos DB with products");
        foreach (var product in products)
        {
            dynamic p = new
            {
                id = product.id.ToString(),
                type = product.type,
                brand = product.brand,
                name = product.name,
                description = product.description,
                price = product.price,
                embedding = await GetEmbeddingsAsync(JsonConvert.SerializeObject(product)),
            };

            var response = await container.CreateItemAsync<dynamic>(p);

            Console.WriteLine(product.name);
        }
        stopwatch.Stop();
        Console.WriteLine($"Duration: {stopwatch.ElapsedMilliseconds} ms");
    }

    private static async Task<float[]> GetEmbeddingsAsync(string inputText)
    {
        var requestBody = new { model = EmbeddingModel, input = inputText };

        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        content.Headers.ContentType = new MediaTypeHeaderValue("application/json")
        {
            CharSet = "utf-8",
        };

        var response = await httpClient.PostAsync(AzureOpenAIEndpoint, content);
        response.EnsureSuccessStatusCode();

        var responseString = await response.Content.ReadAsStringAsync();
        var responseJson = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(responseString);
        return responseJson
            .GetProperty("data")[0]
            .GetProperty("embedding")
            .EnumerateArray()
            .Select(x => x.GetSingle())
            .ToArray();
    }
}
