export const BUSINESS_INDUSTRIES = [
  { value: "salon_spa", label: "Salon & spa" },
  { value: "fitness", label: "Fitness & wellness" },
  { value: "consulting", label: "Consulting" },
  { value: "photography", label: "Photography" },
  { value: "clinic", label: "Clinic & healthcare" },
  { value: "repair", label: "Repair services" },
  { value: "education", label: "Education & coaching" },
  { value: "other", label: "Other service business" }
];

export const SUPPORTED_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata"
];

export const SUPPORTED_CURRENCIES = [
  "usd",
  "cad",
  "eur",
  "gbp",
  "pkr",
  "aed",
  "inr"
];

export const SUPPORTED_COUNTRIES = [
  { value: "PK", label: "Pakistan" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "IN", label: "India" },
  { value: "ES", label: "Spain" },
  { value: "OTHER", label: "Other" }
];

export const COUNTRY_DEFAULTS = {
  PK: {
    timezone: "Asia/Karachi",
    currency: "pkr"
  },
  US: {
    timezone: "America/New_York",
    currency: "usd"
  },
  GB: {
    timezone: "Europe/London",
    currency: "gbp"
  },
  CA: {
    timezone: "America/Toronto",
    currency: "cad"
  },
  DE: {
    timezone: "Europe/Berlin",
    currency: "eur"
  },
  AE: {
    timezone: "Asia/Dubai",
    currency: "aed"
  },
  IN: {
    timezone: "Asia/Kolkata",
    currency: "inr"
  },
  ES: {
    timezone: "Europe/Madrid",
    currency: "eur"
  }
};

export const SUPPORTED_LOCALES = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" }
];

export const DEFAULT_TRIAL_DAYS = 14;
