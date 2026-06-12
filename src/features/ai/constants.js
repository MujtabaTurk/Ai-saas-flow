export const AI_GENERATION_TYPES = {
  SERVICE_DESCRIPTION: "SERVICE_DESCRIPTION",
  CUSTOMER_REPLY: "CUSTOMER_REPLY",
  BUSINESS_SUMMARY: "BUSINESS_SUMMARY",
  BUSINESS_INSIGHTS: "BUSINESS_INSIGHTS",
  TRANSLATION: "TRANSLATION",
  MARKETING_COPY: "MARKETING_COPY"
};

export const AI_GENERATION_TYPE_OPTIONS = [
  {
    value: AI_GENERATION_TYPES.SERVICE_DESCRIPTION,
    label: "Service description",
    description: "Draft clear, customer-friendly copy for a service."
  },
  {
    value: AI_GENERATION_TYPES.CUSTOMER_REPLY,
    label: "Customer reply",
    description: "Prepare a professional response to customer feedback or a question."
  },
  {
    value: AI_GENERATION_TYPES.BUSINESS_SUMMARY,
    label: "Business summary",
    description: "Summarize the business and its current activity."
  },
  {
    value: AI_GENERATION_TYPES.BUSINESS_INSIGHTS,
    label: "Business insights",
    description: "Find practical opportunities from aggregate booking data."
  },
  {
    value: AI_GENERATION_TYPES.TRANSLATION,
    label: "Translation",
    description: "Translate customer-facing copy while preserving its tone."
  },
  {
    value: AI_GENERATION_TYPES.MARKETING_COPY,
    label: "Marketing copy",
    description: "Draft short promotional copy for a campaign or public page."
  }
];

export const AI_TARGET_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
  { value: "ur", label: "Urdu" }
];

export const AI_TONES = ["FRIENDLY", "PROFESSIONAL", "CONCISE", "WARM"];

export const AI_GENERATION_STALE_MINUTES = 10;
