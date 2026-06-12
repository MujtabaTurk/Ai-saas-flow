import OpenAI from "openai";
import { AppError } from "@/lib/api/errors";

const DEFAULT_MODEL = "gpt-5.5";

function parseRate(value) {
  if (value === undefined || String(value).trim() === "") {
    return null;
  }

  const rate = Number(value);

  return Number.isFinite(rate) && rate >= 0 ? rate : null;
}

function calculateEstimatedCostMicros(inputTokens, outputTokens) {
  const inputRate = parseRate(
    process.env.OPENAI_INPUT_COST_PER_MILLION_USD
  );
  const outputRate = parseRate(
    process.env.OPENAI_OUTPUT_COST_PER_MILLION_USD
  );

  if (inputRate === null || outputRate === null) {
    return null;
  }

  return Math.round(inputTokens * inputRate + outputTokens * outputRate);
}

export function getAiProviderConfiguration() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    costRatesConfigured:
      parseRate(process.env.OPENAI_INPUT_COST_PER_MILLION_USD) !== null &&
      parseRate(process.env.OPENAI_OUTPUT_COST_PER_MILLION_USD) !== null
  };
}

export async function generateAiDraft({
  instructions,
  input,
  businessId,
  generationId
}) {
  const configuration = getAiProviderConfiguration();

  if (!configuration.configured) {
    throw new AppError(
      "AI generation is not configured. Add OPENAI_API_KEY to the server environment.",
      503
    );
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 45_000,
    maxRetries: 2
  });
  const response = await client.responses.create({
    model: configuration.model,
    instructions,
    input,
    max_output_tokens: 800,
    store: false,
    metadata: {
      businessId,
      generationId
    }
  });
  const output = response.output_text?.trim();

  if (!output) {
    throw new AppError("The AI provider returned an empty draft.", 502);
  }

  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;

  return {
    output,
    model: response.model || configuration.model,
    providerResponseId: response.id || null,
    inputTokens,
    outputTokens,
    totalTokens:
      response.usage?.total_tokens || inputTokens + outputTokens,
    estimatedCostMicros: calculateEstimatedCostMicros(
      inputTokens,
      outputTokens
    )
  };
}
