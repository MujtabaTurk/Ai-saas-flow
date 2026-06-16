import { AppError } from "@/lib/api/errors";

const DEFAULT_PROVIDER = "gemini";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 800;
const PROVIDER_MESSAGE_MAX_LENGTH = 2_000;

function readEnv(name) {
  return process.env[name]?.trim() || "";
}

function parseRate(value) {
  if (value === undefined || String(value).trim() === "") {
    return null;
  }

  const rate = Number(value);

  return Number.isFinite(rate) && rate >= 0 ? rate : null;
}

function toTokenCount(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateEstimatedCostMicros({
  inputTokens,
  outputTokens,
  inputRate,
  outputRate
}) {
  if (inputRate === null || outputRate === null) {
    return null;
  }

  return Math.round(inputTokens * inputRate + outputTokens * outputRate);
}

function compactProviderMessage(message) {
  if (!message) {
    return null;
  }

  return String(message).replace(/\s+/g, " ").trim();
}

function truncateProviderMessage(message) {
  const compacted = compactProviderMessage(message);

  if (!compacted) {
    return null;
  }

  if (compacted.length <= PROVIDER_MESSAGE_MAX_LENGTH) {
    return compacted;
  }

  return `${compacted.slice(0, PROVIDER_MESSAGE_MAX_LENGTH)}...`;
}

function logAiProviderEvent(level, event, metadata = {}) {
  const logger =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.info;

  logger("[ai-provider]", {
    event,
    ...metadata
  });
}

function createProviderError({
  message,
  status = 502,
  code = "PROVIDER_ERROR",
  provider,
  metadata
}) {
  const details = {
    code,
    provider,
    ...metadata
  };
  const error = new AppError(message, status, details);
  error.code = code;

  logAiProviderEvent("error", "provider_error", {
    provider,
    code,
    status,
    ...details
  });

  return error;
}

function createTimeoutError(provider) {
  return createProviderError({
    provider,
    status: 504,
    code: "GEMINI_TIMEOUT",
    message: "The AI provider timed out while generating this draft."
  });
}

function createNetworkError(provider) {
  return createProviderError({
    provider,
    status: 502,
    code: "GEMINI_UNREACHABLE",
    message: "The AI provider could not be reached."
  });
}

const geminiProvider = {
  name: "gemini",
  displayName: "Google Gemini",
  defaultModel: "gemini-2.5-pro",
  requiredEnvironmentVariables: ["GEMINI_API_KEY", "GEMINI_MODEL"],

  getConfiguration() {
    const inputRate = parseRate(
      process.env.GEMINI_INPUT_COST_PER_MILLION_USD
    );
    const outputRate = parseRate(
      process.env.GEMINI_OUTPUT_COST_PER_MILLION_USD
    );
    const model = readEnv("GEMINI_MODEL") || this.defaultModel;
    const configured = Boolean(readEnv("GEMINI_API_KEY"));

    return {
      provider: this.name,
      displayName: this.displayName,
      configured,
      model,
      requiredEnvironmentVariables: this.requiredEnvironmentVariables,
      configurationMessage: configured
        ? null
        : "AI generation is not configured. Add GEMINI_API_KEY to the server environment.",
      costRatesConfigured: inputRate !== null && outputRate !== null,
      costRates: {
        input: inputRate,
        output: outputRate
      }
    };
  },

  async generateDraft({
    configuration,
    instructions,
    input,
    businessId,
    generationId,
    userId
  }) {
    const response = await createGeminiContent({
      configuration,
      body: buildGeminiRequestBody({
        instructions,
        input,
        model: configuration.model
      }),
      metadata: {
        businessId,
        generationId,
        userId
      }
    });

    return extractGeminiDraftResult(response, configuration);
  }
};

const AI_PROVIDERS = {
  [geminiProvider.name]: geminiProvider
};

function getActiveProviderName() {
  return (readEnv("AI_PROVIDER") || DEFAULT_PROVIDER).toLowerCase();
}

function getActiveProvider() {
  return AI_PROVIDERS[getActiveProviderName()] || null;
}

function buildGeminiUrl(model) {
  const normalizedModel = String(model || geminiProvider.defaultModel)
    .replace(/^models\//, "")
    .trim();

  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}:generateContent`;
}

function shouldDisableThinking(model) {
  return /^gemini-2\.5-flash/i.test(String(model || ""));
}

function buildGeminiGenerationConfig(model) {
  const config = {
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    responseMimeType: "text/plain"
  };

  if (shouldDisableThinking(model)) {
    config.thinkingConfig = {
      thinkingBudget: 0
    };
  }

  return config;
}

function buildGeminiRequestBody({ instructions, input, model }) {
  return {
    systemInstruction: {
      parts: [
        {
          text: instructions
        }
      ]
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: input
          }
        ]
      }
    ],
    generationConfig: buildGeminiGenerationConfig(model)
  };
}

async function parseGeminiError(response, configuration) {
  const payload = await response.json().catch(() => null);
  const providerMessage =
    payload?.error?.message || payload?.message || response.statusText;
  const safeProviderMessage = truncateProviderMessage(providerMessage);
  const providerCode =
    payload?.error?.status || payload?.error?.code || `HTTP_${response.status}`;
  const provider = geminiProvider.name;
  const retryAfter = response.headers.get("retry-after");
  const metadata = {
    model: configuration.model,
    providerStatus: response.status,
    providerCode,
    providerMessage: safeProviderMessage,
    retryAfterSeconds: retryAfter ? Number(retryAfter) : null
  };

  if (response.status === 400) {
    return createProviderError({
      provider,
      status: 502,
      code: "GEMINI_INVALID_REQUEST",
      message: safeProviderMessage
        ? `Gemini rejected the request: ${safeProviderMessage}`
        : "The AI provider rejected the request format.",
      metadata
    });
  }

  if (response.status === 401 || response.status === 403) {
    return createProviderError({
      provider,
      status: 503,
      code: "GEMINI_AUTHENTICATION_FAILED",
      message: safeProviderMessage
        ? `Gemini authentication failed: ${safeProviderMessage}`
        : "Gemini authentication failed. Check GEMINI_API_KEY.",
      metadata
    });
  }

  if (response.status === 404) {
    return createProviderError({
      provider,
      status: 503,
      code: "GEMINI_MODEL_NOT_FOUND",
      message: safeProviderMessage
        ? `Gemini model error: ${safeProviderMessage}`
        : "The configured Gemini model could not be found.",
      metadata
    });
  }

  if (response.status === 429) {
    const quotaExceeded = /quota|resource_exhausted/i.test(
      `${providerCode} ${safeProviderMessage || ""}`
    );

    return createProviderError({
      provider,
      status: 429,
      code: quotaExceeded ? "GEMINI_QUOTA_EXCEEDED" : "GEMINI_RATE_LIMITED",
      message: safeProviderMessage
        ? `Gemini ${quotaExceeded ? "quota exceeded" : "rate limit"}: ${safeProviderMessage}`
        : "The AI provider is busy or rate-limited. Please try again shortly.",
      metadata
    });
  }

  if (response.status === 503) {
    return createProviderError({
      provider,
      status: 503,
      code: "GEMINI_UNAVAILABLE",
      message: safeProviderMessage
        ? `Gemini is temporarily unavailable: ${safeProviderMessage}`
        : "The AI provider is temporarily unavailable. Please try again shortly.",
      metadata
    });
  }

  if (response.status === 504) {
    return createProviderError({
      provider,
      status: 504,
      code: "GEMINI_DEADLINE_EXCEEDED",
      message: safeProviderMessage
        ? `Gemini deadline exceeded: ${safeProviderMessage}`
        : "The AI provider could not finish this draft in time.",
      metadata
    });
  }

  return createProviderError({
    provider,
    status: 502,
    code:
      typeof providerCode === "string"
        ? `GEMINI_${providerCode}`.slice(0, 80)
        : `GEMINI_HTTP_${response.status}`,
    message: safeProviderMessage
      ? `Gemini rejected the request: ${safeProviderMessage}`
      : "The AI provider could not generate a draft.",
    metadata
  });
}

async function createGeminiContent({ configuration, body, metadata }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    logAiProviderEvent("info", "provider_request_started", {
      provider: geminiProvider.name,
      model: configuration.model,
      ...metadata
    });

    const response = await fetch(buildGeminiUrl(configuration.model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": readEnv("GEMINI_API_KEY")
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw await parseGeminiError(response, configuration);
    }

    const payload = await response.json();

    logAiProviderEvent("info", "provider_request_completed", {
      provider: geminiProvider.name,
      model: configuration.model,
      ...metadata,
      durationMs: Date.now() - startedAt,
      responseId: payload.responseId || null,
      finishReason: payload.candidates?.[0]?.finishReason || null
    });

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw createTimeoutError(geminiProvider.name);
    }

    throw createNetworkError(geminiProvider.name);
  } finally {
    clearTimeout(timeout);
  }
}

function extractGeminiText(parts = []) {
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function isContentBlocked(reason) {
  return [
    "SAFETY",
    "RECITATION",
    "BLOCKLIST",
    "PROHIBITED_CONTENT",
    "SPII"
  ].includes(reason);
}

function extractGeminiDraftResult(response, configuration) {
  const candidate = response.candidates?.[0] || null;
  const finishReason = candidate?.finishReason || null;
  const output = extractGeminiText(candidate?.content?.parts);

  if (!output) {
    const promptBlockReason = response.promptFeedback?.blockReason || null;
    const reason = promptBlockReason || finishReason || "EMPTY_RESPONSE";
    const blocked = promptBlockReason || isContentBlocked(finishReason);

    throw createProviderError({
      provider: geminiProvider.name,
      status: blocked ? 422 : 502,
      code: `GEMINI_${reason}`.slice(0, 80),
      message: blocked
        ? "Gemini blocked this request or response because of safety policy."
        : "The AI provider returned an empty draft.",
      metadata: {
        model: configuration.model,
        finishReason,
        promptBlockReason,
        responseId: response.responseId || null
      }
    });
  }

  if (finishReason && finishReason !== "STOP") {
    logAiProviderEvent(
      isContentBlocked(finishReason) ? "warn" : "info",
      "provider_finish_reason",
      {
        provider: geminiProvider.name,
        model: configuration.model,
        finishReason,
        responseId: response.responseId || null
      }
    );
  }

  const inputTokens = toTokenCount(
    response.usageMetadata?.promptTokenCount
  );
  const outputTokens = toTokenCount(
    response.usageMetadata?.candidatesTokenCount
  );

  return {
    output,
    model: response.modelVersion || configuration.model,
    providerResponseId: response.responseId || null,
    inputTokens,
    outputTokens,
    totalTokens:
      toTokenCount(response.usageMetadata?.totalTokenCount) ||
      inputTokens + outputTokens,
    estimatedCostMicros: calculateEstimatedCostMicros({
      inputTokens,
      outputTokens,
      inputRate: configuration.costRates.input,
      outputRate: configuration.costRates.output
    })
  };
}

export function getAiProviderConfiguration() {
  const provider = getActiveProvider();

  if (!provider) {
    const providerName = getActiveProviderName();

    return {
      provider: providerName,
      displayName: providerName,
      configured: false,
      model: null,
      requiredEnvironmentVariables: ["AI_PROVIDER"],
      configurationMessage: `AI provider "${providerName}" is not supported.`,
      costRatesConfigured: false
    };
  }

  const configuration = provider.getConfiguration();

  return {
    provider: configuration.provider,
    displayName: configuration.displayName,
    configured: configuration.configured,
    model: configuration.model,
    requiredEnvironmentVariables: configuration.requiredEnvironmentVariables,
    configurationMessage: configuration.configurationMessage,
    costRatesConfigured: configuration.costRatesConfigured
  };
}

export async function generateAiDraft({
  instructions,
  input,
  businessId,
  generationId,
  userId
}) {
  const provider = getActiveProvider();

  if (!provider) {
    throw new AppError(
      `AI provider "${getActiveProviderName()}" is not supported.`,
      503
    );
  }

  const configuration = provider.getConfiguration();

  if (!configuration.configured) {
    throw new AppError(configuration.configurationMessage, 503);
  }

  return provider.generateDraft({
    configuration,
    instructions,
    input,
    businessId,
    generationId,
    userId
  });
}
