import * as dotenv from "dotenv";

import { AzureOpenAI } from "openai";

const FILE_NAME = "src/aoai.ts";

/**
 * Get embeddings from Azure OpenAI
 * @param {string} q
 * @returns {Promise<number[]>}
 */
export const getEmbeddingsAsync = async (q: string) => {
  try {
    console.log(`[${FILE_NAME}] q: ${q}`);

    dotenv.config();
    console.log(`[${FILE_NAME}] Embedding model=${process.env.AZURE_OPENAI_EMBEDDING_MODEL!}`);

    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      apiVersion: "2024-12-01-preview",
    });

    const embeddingResponse = await client.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_MODEL!,
      input: q,
    });
    const [{ embedding }] = embeddingResponse.data;
    // console.log(`[${FILE_NAME}] Embeddings: ${JSON.stringify(embedding.slice(0, 50))}...`)
    return embedding;
  } catch (error) {
    console.error(`[${FILE_NAME}] Error getting embeddings: ${JSON.stringify(error)}`);
  }
};
