"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Settings2,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldError } from "@/features/auth/components/field-error";
import {
  BUSINESS_INDUSTRIES,
  COUNTRY_DEFAULTS,
  DEFAULT_TRIAL_DAYS,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";
import { DEFAULT_BUSINESS_SETTINGS } from "@/features/businesses/onboarding-defaults";
import { PLAN_LIMITS } from "@/features/businesses/plan-limits";
import {
  createSlugFromName,
  normalizeBusinessSlug
} from "@/features/businesses/slug";
import { businessOnboardingSchema } from "@/features/businesses/validation/onboarding-schema";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import { cn } from "@/lib/utils";

const DRAFT_STORAGE_KEY = "serviceflow_business_onboarding_draft";
const DEFAULT_COUNTRY = "PK";
const DEFAULT_COUNTRY_SETTINGS = COUNTRY_DEFAULTS[DEFAULT_COUNTRY];

const INITIAL_VALUES = {
  name: "",
  slug: "",
  industry: "salon_spa",
  logoUrl: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: DEFAULT_COUNTRY,
  website: "",
  timezone: DEFAULT_COUNTRY_SETTINGS.timezone,
  currency: DEFAULT_COUNTRY_SETTINGS.currency,
  locale: "en",
  bookingLeadTimeMin: DEFAULT_BUSINESS_SETTINGS.bookingLeadTimeMin,
  bookingWindowDays: DEFAULT_BUSINESS_SETTINGS.bookingWindowDays,
  cancellationWindowMin: DEFAULT_BUSINESS_SETTINGS.cancellationWindowMin,
  allowGuestBookings: DEFAULT_BUSINESS_SETTINGS.allowGuestBookings,
  autoConfirmBookings: DEFAULT_BUSINESS_SETTINGS.autoConfirmBookings
};

const BASIC_FIELDS = ["name", "slug", "industry", "logoUrl"];
const CONFIGURATION_FIELDS = [
  "email",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "country",
  "website",
  "timezone",
  "currency",
  "locale",
  "bookingLeadTimeMin",
  "bookingWindowDays",
  "cancellationWindowMin",
  "allowGuestBookings",
  "autoConfirmBookings"
];
const REVIEW_FIELDS = [...BASIC_FIELDS, ...CONFIGURATION_FIELDS];

const WIZARD_STEPS = [
  {
    id: "basics",
    title: "Business Basics",
    eyebrow: "Step 1",
    description: "Name the workspace and reserve the public booking URL.",
    fields: BASIC_FIELDS,
    icon: Building2
  },
  {
    id: "configuration",
    title: "Business Configuration",
    eyebrow: "Step 2",
    description: "Set contact, locale, and booking defaults.",
    fields: CONFIGURATION_FIELDS,
    icon: Settings2
  },
  {
    id: "review",
    title: "Review & Confirmation",
    eyebrow: "Step 3",
    description: "Review everything before the workspace is created.",
    fields: REVIEW_FIELDS,
    icon: CheckCircle2
  },
  {
    id: "trial",
    title: "Trial Plan Overview",
    eyebrow: "Step 4",
    description: "Confirm the trial plan that will be attached to this business.",
    fields: [],
    icon: Sparkles
  },
  {
    id: "success",
    title: "Success",
    eyebrow: "Step 5",
    description: "Your business workspace is ready.",
    fields: [],
    icon: Check
  }
];

function SelectField({ children, className = "", ...props }) {
  return (
    <Select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </Select>
  );
}

function formatOptional(value, fallback = "Not provided") {
  return value?.toString().trim() || fallback;
}

function findLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function formatCurrency(value) {
  return value ? value.toUpperCase() : "Not selected";
}

function getCountryDefaults(country) {
  return COUNTRY_DEFAULTS[country] || null;
}

function getCountryLabel(country) {
  return findLabel(SUPPORTED_COUNTRIES, country);
}

function formatMinutes(value) {
  const minutes = Number(value || 0);

  if (minutes === 0) {
    return "No minimum";
  }

  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${minutes} minutes`;
}

function formatLimit(limit) {
  return limit === null || limit === undefined ? "Unlimited" : limit;
}

function touchFields(fields) {
  return fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}

function ProgressIndicator({
  currentStepIndex,
  createdBusiness,
  onStepSelect
}) {
  return (
    <aside className="sticky top-4 z-10 rounded-2xl border border-growth-border bg-white p-3 shadow-sm lg:top-6 lg:p-4">
      <div className="mb-3 hidden px-1 lg:block">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Setup progress
        </p>
      </div>
      <ol className="grid grid-cols-5 gap-2 lg:grid-cols-1">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStepIndex === index;
          const isComplete = createdBusiness
            ? index < WIZARD_STEPS.length - 1
            : index < currentStepIndex;
          const canVisit = createdBusiness
            ? index === WIZARD_STEPS.length - 1
            : index <= currentStepIndex;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={cn(
                  "flex h-full w-full items-center justify-center gap-2 rounded-xl border px-2 py-2 text-start text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:justify-start lg:px-3",
                  isActive
                    ? "border-primary bg-growth-mint text-growth-sidebar"
                    : "border-transparent bg-transparent text-muted-foreground",
                  canVisit ? "hover:bg-growth-dashboard" : "cursor-not-allowed opacity-60"
                )}
                aria-current={isActive ? "step" : undefined}
                disabled={!canVisit}
                onClick={() => onStepSelect(index)}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-[11px]",
                    isComplete
                      ? "border-primary bg-primary text-white"
                      : "border-growth-border bg-white text-growth-sidebar"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <Icon className="hidden size-4 shrink-0 lg:block" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function StepHeader({ step, headingRef }) {
  return (
    <div className="border-b border-growth-border pb-5">
      <Badge>{step.eyebrow}</Badge>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 text-2xl font-bold tracking-tight text-growth-sidebar focus-visible:outline-none sm:text-3xl"
      >
        {step.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}

function StepActions({
  canGoBack,
  isSubmitting,
  nextLabel = "Continue",
  onBack,
  onNext
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-growth-border pt-5 sm:flex-row sm:justify-between">
      <Button
        type="button"
        variant="outline"
        disabled={!canGoBack || isSubmitting}
        onClick={onBack}
      >
        <ArrowLeft className="me-2 size-4 rtl:rotate-180" aria-hidden="true" />
        Previous
      </Button>
      <Button type="button" disabled={isSubmitting} onClick={onNext}>
        {nextLabel}
        <ArrowRight className="ms-2 size-4 rtl:rotate-180" aria-hidden="true" />
      </Button>
    </div>
  );
}

function ToggleField({
  checked,
  description,
  disabled,
  id,
  label,
  onChange
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-growth-border bg-growth-dashboard/60 p-4"
    >
      <span>
        <span className="block text-sm font-semibold text-growth-sidebar">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <Checkbox
        id={id}
        className="mt-1 size-5 rounded border-growth-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </label>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-growth-sidebar">
        {value}
      </dd>
    </div>
  );
}

function SummarySection({ children, onEdit, title }) {
  return (
    <section className="space-y-4 border-t border-growth-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-growth-sidebar">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function PlanMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-growth-sidebar">{value}</p>
    </div>
  );
}

export function BusinessOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const stepHeadingRef = useRef(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [createdBusiness, setCreatedBusiness] = useState(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const slugEditedRef = useRef(false);
  const [slugStatus, setSlugStatus] = useState({
    slug: "",
    state: "idle",
    message: ""
  });

  const formik = useFormik({
    initialValues: INITIAL_VALUES,
    validationSchema: businessOnboardingSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      if (currentSlugStatus.state !== "available") {
        helpers.setFieldError(
          "slug",
          currentSlugStatus.state === "taken"
            ? "This public booking slug is already taken."
            : "Confirm that this public slug is available."
        );
        setCurrentStepIndex(0);
        return;
      }

      const response = await fetch("/api/onboarding/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json();

      if (!response.ok) {
        helpers.setStatus(
          payload?.error?.message || "Could not create your business workspace."
        );
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setCreatedBusiness(payload.data.business);
      await update();
      setCurrentStepIndex(4);
      router.refresh();
    }
  });

  const setFormValues = formik.setValues;
  const setFieldValue = formik.setFieldValue;

  const publicUrlPreview = useMemo(() => {
    const slug = normalizeBusinessSlug(formik.values.slug);

    return slug ? `/${slug}` : "/your-business";
  }, [formik.values.slug]);

  const normalizedSlug = normalizeBusinessSlug(formik.values.slug);
  const canCheckSlug = normalizedSlug.length >= 3 && !formik.errors.slug;
  const currentSlugStatus =
    canCheckSlug && slugStatus.slug === normalizedSlug
      ? slugStatus
      : {
          slug: normalizedSlug,
          state: "idle",
          message: ""
        };
  const currentStep = WIZARD_STEPS[currentStepIndex];
  const trialLimits = PLAN_LIMITS.TRIAL;
  const paidPlans = [PLAN_CATALOG.BASIC, PLAN_CATALOG.PRO];
  const selectedCountryDefaults = getCountryDefaults(formik.values.country);
  const selectedCountryLabel = getCountryLabel(formik.values.country);
  const suggestedCurrency = selectedCountryDefaults?.currency || null;
  const suggestedTimezone = selectedCountryDefaults?.timezone || null;
  const isSuggestedCurrency =
    Boolean(suggestedCurrency) && formik.values.currency === suggestedCurrency;
  const isSuggestedTimezone =
    Boolean(suggestedTimezone) && formik.values.timezone === suggestedTimezone;
  const currencyHelpText = selectedCountryDefaults
    ? isSuggestedCurrency
      ? `Auto-selected for ${selectedCountryLabel}. You can change it if needed.`
      : `Manually set. Suggested for ${selectedCountryLabel}: ${formatCurrency(suggestedCurrency)}.`
    : "Select the currency used for service pricing.";
  const timezoneHelpText = selectedCountryDefaults
    ? isSuggestedTimezone
      ? `Suggested time zone for ${selectedCountryLabel}. You can change it if your business operates elsewhere.`
      : `Manually set. Suggested for ${selectedCountryLabel}: ${suggestedTimezone}.`
    : "Select the time zone used for availability and bookings.";

  useEffect(() => {
    const storedDraft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);

    if (storedDraft) {
      try {
        const draftValues = JSON.parse(storedDraft);
        setFormValues(
          {
            ...INITIAL_VALUES,
            ...draftValues
          },
          false
        );

        slugEditedRef.current = Boolean(draftValues.slug);
      } catch {
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }

    const hydrationTimeoutId = window.setTimeout(() => {
      setDraftHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimeoutId);
  }, [setFormValues]);

  useEffect(() => {
    if (!draftHydrated || createdBusiness) {
      return;
    }

    window.sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify(formik.values)
    );
  }, [createdBusiness, draftHydrated, formik.values]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!createdBusiness && formik.dirty && !formik.isSubmitting) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [createdBusiness, formik.dirty, formik.isSubmitting]);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [currentStepIndex]);

  useEffect(() => {
    if (!canCheckSlug) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSlugStatus({
        slug: normalizedSlug,
        state: "checking",
        message: "Checking availability..."
      });

      try {
        const response = await fetch(
          `/api/onboarding/slug?slug=${encodeURIComponent(normalizedSlug)}`,
          {
            signal: controller.signal
          }
        );
        const payload = await response.json();

        if (!response.ok) {
          setSlugStatus({
            slug: normalizedSlug,
            state: "invalid",
            message: payload?.error?.details?.slug || "Enter a valid slug."
          });
          return;
        }

        setSlugStatus({
          slug: normalizedSlug,
          state: payload.data.available ? "available" : "taken",
          message: payload.data.available
            ? "This public URL is available."
            : "This public URL is already taken."
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setSlugStatus({
            slug: normalizedSlug,
            state: "invalid",
            message: "Could not check this public URL. Please try again."
          });
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canCheckSlug, normalizedSlug]);

  function handleNameChange(event) {
    formik.handleChange(event);

    if (!slugEditedRef.current) {
      void setFieldValue("slug", createSlugFromName(event.target.value));
    }
  }

  function handleSlugChange(event) {
    slugEditedRef.current = true;
    void setFieldValue("slug", normalizeBusinessSlug(event.target.value));
  }

  function handleCountryChange(event) {
    const country = event.target.value;
    const countryDefaults = getCountryDefaults(country);

    void setFieldValue("country", country);

    if (countryDefaults) {
      void setFieldValue("timezone", countryDefaults.timezone);
      void setFieldValue("currency", countryDefaults.currency);
    }
  }

  async function validateStep(stepIndex) {
    const fields = WIZARD_STEPS[stepIndex]?.fields || [];
    const errors = await formik.validateForm();
    formik.setTouched(
      {
        ...formik.touched,
        ...touchFields(fields)
      },
      false
    );

    const firstErrorField = fields.find((field) => errors[field]);

    if (firstErrorField) {
      return false;
    }

    if (stepIndex === 0 && currentSlugStatus.state !== "available") {
      formik.setFieldTouched("slug", true, false);
      formik.setFieldError(
        "slug",
        currentSlugStatus.state === "taken"
          ? "This public booking slug is already taken."
          : "Confirm that this public slug is available."
      );
      return false;
    }

    return true;
  }

  async function validateReview() {
    const errors = await formik.validateForm();
    formik.setTouched(
      {
        ...formik.touched,
        ...touchFields(REVIEW_FIELDS)
      },
      false
    );

    const invalidStepIndex = WIZARD_STEPS.slice(0, 2).findIndex((step) =>
      step.fields.some((field) => errors[field])
    );

    if (invalidStepIndex >= 0) {
      setCurrentStepIndex(invalidStepIndex);
      return false;
    }

    if (currentSlugStatus.state !== "available") {
      setCurrentStepIndex(0);
      formik.setFieldTouched("slug", true, false);
      formik.setFieldError("slug", "Confirm that this public slug is available.");
      return false;
    }

    return true;
  }

  async function goNext() {
    if (currentStepIndex <= 1) {
      const isStepValid = await validateStep(currentStepIndex);

      if (!isStepValid) {
        return;
      }
    }

    if (currentStepIndex === 2) {
      const isReviewValid = await validateReview();

      if (!isReviewValid) {
        return;
      }
    }

    setCurrentStepIndex((index) => Math.min(index + 1, 3));
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  async function createBusiness() {
    const isReviewValid = await validateReview();

    if (!isReviewValid) {
      return;
    }

    await formik.submitForm();
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  function startSetupWizard() {
    router.push("/dashboard/services");
  }

  function renderStepContent() {
    if (currentStepIndex === 0) {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Fresh Glow Studio"
                value={formik.values.name}
                onBlur={formik.handleBlur}
                onChange={handleNameChange}
              />
              <FieldError>
                {formik.touched.name && formik.errors.name}
              </FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Business slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="fresh-glow-studio"
                value={formik.values.slug}
                onBlur={formik.handleBlur}
                onChange={handleSlugChange}
                aria-describedby="slug-status"
              />
              <FieldError>
                {formik.touched.slug && formik.errors.slug}
              </FieldError>
              <p
                id="slug-status"
                className={cn(
                  "min-h-5 text-sm font-medium",
                  currentSlugStatus.state === "available"
                    ? "text-emerald-700"
                    : "text-amber-700"
                )}
                aria-live="polite"
              >
                {currentSlugStatus.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Business category</Label>
              <SelectField
                id="industry"
                name="industry"
                value={formik.values.industry}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                {BUSINESS_INDUSTRIES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </SelectField>
              <FieldError>
                {formik.touched.industry && formik.errors.industry}
              </FieldError>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logoUrl">Business logo URL</Label>
              <div className="grid gap-3 sm:grid-cols-[4rem_1fr]">
                <div className="grid size-16 place-items-center overflow-hidden rounded-2xl border border-growth-border bg-growth-dashboard text-growth-forest">
                  {formik.values.logoUrl && !formik.errors.logoUrl ? (
                    <span
                      className="size-full bg-cover bg-center"
                      role="img"
                      aria-label="Business logo preview"
                      style={{
                        backgroundImage: `url("${formik.values.logoUrl}")`
                      }}
                    />
                  ) : (
                    <ImageIcon className="size-6" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formik.values.logoUrl}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  />
                  <FieldError>
                    {formik.touched.logoUrl && formik.errors.logoUrl}
                  </FieldError>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm">
            <p className="font-semibold text-growth-sidebar">
              Public booking URL preview
            </p>
            <p className="mt-1 text-muted-foreground">{publicUrlPreview}</p>
          </div>
        </div>
      );
    }

    if (currentStepIndex === 1) {
      return (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold text-growth-sidebar">
                Contact Information
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={formik.values.email}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.email && formik.errors.email}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+92 300 0000000"
                  value={formik.values.phone}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.phone && formik.errors.phone}
                </FieldError>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  placeholder="Office, studio, or street address"
                  value={formik.values.addressLine1}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.addressLine1 && formik.errors.addressLine1}
                </FieldError>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">Address details</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="Suite, floor, area, or landmark"
                  value={formik.values.addressLine2}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.addressLine2 && formik.errors.addressLine2}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Karachi"
                  value={formik.values.city}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.city && formik.errors.city}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <SelectField
                  id="country"
                  name="country"
                  value={formik.values.country}
                  onBlur={formik.handleBlur}
                  onChange={handleCountryChange}
                >
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </SelectField>
                <FieldError>
                  {formik.touched.country && formik.errors.country}
                </FieldError>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="serviceflow.com"
                  value={formik.values.website}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.website && formik.errors.website}
                </FieldError>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-growth-border pt-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold text-growth-sidebar">
                Configuration
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <Label htmlFor="timezone">Time zone</Label>
                  {selectedCountryDefaults ? (
                    <Badge
                      variant={isSuggestedTimezone ? "success" : "outline"}
                      className="px-2 py-0.5"
                    >
                      {isSuggestedTimezone ? "Suggested" : "Manual"}
                    </Badge>
                  ) : null}
                </div>
                <SelectField
                  id="timezone"
                  name="timezone"
                  value={formik.values.timezone}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  aria-describedby="timezone-help"
                >
                  {SUPPORTED_TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </SelectField>
                <p
                  id="timezone-help"
                  className="min-h-5 text-xs leading-5 text-muted-foreground"
                  aria-live="polite"
                >
                  {timezoneHelpText}
                </p>
                <FieldError>
                  {formik.touched.timezone && formik.errors.timezone}
                </FieldError>
              </div>

              <div className="space-y-2">
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  {selectedCountryDefaults ? (
                    <Badge
                      variant={isSuggestedCurrency ? "success" : "outline"}
                      className="px-2 py-0.5"
                    >
                      {isSuggestedCurrency ? "Auto-selected" : "Manual"}
                    </Badge>
                  ) : null}
                </div>
                <SelectField
                  id="currency"
                  name="currency"
                  value={formik.values.currency}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  aria-describedby="currency-help"
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency.toUpperCase()}
                    </option>
                  ))}
                </SelectField>
                <p
                  id="currency-help"
                  className="min-h-5 text-xs leading-5 text-muted-foreground"
                  aria-live="polite"
                >
                  {currencyHelpText}
                </p>
                <FieldError>
                  {formik.touched.currency && formik.errors.currency}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">Default language</Label>
                <SelectField
                  id="locale"
                  name="locale"
                  value={formik.values.locale}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                >
                  {SUPPORTED_LOCALES.map((locale) => (
                    <option key={locale.value} value={locale.value}>
                      {locale.label}
                    </option>
                  ))}
                </SelectField>
                <FieldError>
                  {formik.touched.locale && formik.errors.locale}
                </FieldError>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-growth-border pt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="size-4 text-primary" aria-hidden="true" />
              <h3 className="font-bold text-growth-sidebar">
                Business Settings
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bookingLeadTimeMin">
                  Booking lead time
                </Label>
                <Input
                  id="bookingLeadTimeMin"
                  name="bookingLeadTimeMin"
                  type="number"
                  min="0"
                  max="10080"
                  value={formik.values.bookingLeadTimeMin}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.bookingLeadTimeMin &&
                    formik.errors.bookingLeadTimeMin}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingWindowDays">Booking window</Label>
                <Input
                  id="bookingWindowDays"
                  name="bookingWindowDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formik.values.bookingWindowDays}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.bookingWindowDays &&
                    formik.errors.bookingWindowDays}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationWindowMin">
                  Cancellation window
                </Label>
                <Input
                  id="cancellationWindowMin"
                  name="cancellationWindowMin"
                  type="number"
                  min="0"
                  max="10080"
                  value={formik.values.cancellationWindowMin}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                />
                <FieldError>
                  {formik.touched.cancellationWindowMin &&
                    formik.errors.cancellationWindowMin}
                </FieldError>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                id="allowGuestBookings"
                label="Allow guest bookings"
                description="Customers can book without creating an account first."
                checked={formik.values.allowGuestBookings}
                onChange={(event) =>
                  void setFieldValue("allowGuestBookings", event.target.checked)
                }
              />
              <ToggleField
                id="autoConfirmBookings"
                label="Auto-confirm bookings"
                description="New bookings are confirmed immediately instead of waiting for review."
                checked={formik.values.autoConfirmBookings}
                onChange={(event) =>
                  void setFieldValue("autoConfirmBookings", event.target.checked)
                }
              />
            </div>
          </section>
        </div>
      );
    }

    if (currentStepIndex === 2) {
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm">
            <p className="font-semibold text-growth-sidebar">
              Public booking URL
            </p>
            <p className="mt-1 text-muted-foreground">{publicUrlPreview}</p>
          </div>

          <SummarySection
            title="Business Basics"
            onEdit={() => setCurrentStepIndex(0)}
          >
            <SummaryItem label="Business name" value={formik.values.name} />
            <SummaryItem
              label="Category"
              value={findLabel(BUSINESS_INDUSTRIES, formik.values.industry)}
            />
            <SummaryItem label="Slug" value={formik.values.slug} />
            <SummaryItem
              label="Logo"
              value={formatOptional(formik.values.logoUrl)}
            />
          </SummarySection>

          <SummarySection
            title="Contact Information"
            onEdit={() => setCurrentStepIndex(1)}
          >
            <SummaryItem
              label="Email"
              value={formatOptional(formik.values.email)}
            />
            <SummaryItem
              label="Phone"
              value={formatOptional(formik.values.phone)}
            />
            <SummaryItem
              label="Address"
              value={formatOptional(formik.values.addressLine1)}
            />
            <SummaryItem
              label="Address details"
              value={formatOptional(formik.values.addressLine2)}
            />
            <SummaryItem
              label="City"
              value={formatOptional(formik.values.city)}
            />
            <SummaryItem
              label="Country"
              value={findLabel(SUPPORTED_COUNTRIES, formik.values.country)}
            />
            <SummaryItem
              label="Website"
              value={formatOptional(formik.values.website)}
            />
          </SummarySection>

          <SummarySection
            title="Configuration"
            onEdit={() => setCurrentStepIndex(1)}
          >
            <SummaryItem label="Time zone" value={formik.values.timezone} />
            <SummaryItem
              label="Currency"
              value={formatCurrency(formik.values.currency)}
            />
            <SummaryItem
              label="Language"
              value={findLabel(SUPPORTED_LOCALES, formik.values.locale)}
            />
            <SummaryItem
              label="Lead time"
              value={formatMinutes(formik.values.bookingLeadTimeMin)}
            />
            <SummaryItem
              label="Booking window"
              value={`${formik.values.bookingWindowDays} days`}
            />
            <SummaryItem
              label="Cancellation window"
              value={formatMinutes(formik.values.cancellationWindowMin)}
            />
            <SummaryItem
              label="Guest bookings"
              value={formik.values.allowGuestBookings ? "Allowed" : "Disabled"}
            />
            <SummaryItem
              label="Booking confirmation"
              value={formik.values.autoConfirmBookings ? "Automatic" : "Manual"}
            />
          </SummarySection>
        </div>
      );
    }

    if (currentStepIndex === 3) {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary bg-growth-mint/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Current Trial Plan
                </p>
                <h3 className="mt-1 text-2xl font-bold text-growth-sidebar">
                  {PLAN_CATALOG.TRIAL.name}
                </h3>
              </div>
              <Badge variant="success">{DEFAULT_TRIAL_DAYS} days</Badge>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {PLAN_CATALOG.TRIAL.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PlanMetric
              label="Team members"
              value={formatLimit(trialLimits.teamMembers)}
            />
            <PlanMetric
              label="Services"
              value={formatLimit(trialLimits.services)}
            />
            <PlanMetric
              label="Bookings"
              value={formatLimit(trialLimits.bookings)}
            />
            <PlanMetric
              label="AI features"
              value={`${trialLimits.aiCredits} credits`}
            />
          </div>

          <section className="space-y-3">
            <h3 className="font-bold text-growth-sidebar">Plan benefits</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PLAN_CATALOG.TRIAL.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-growth-sidebar"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-growth-mint text-growth-forest">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {feature}
                </li>
              ))}
              <li className="flex items-center gap-3 text-sm text-growth-sidebar">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-growth-mint text-growth-forest">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                Default weekday availability
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-growth-border pt-5">
            <h3 className="font-bold text-growth-sidebar">Upgrade options</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {paidPlans.map((plan) => (
                <div
                  key={plan.code}
                  className="rounded-2xl border border-growth-border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-growth-sidebar">{plan.name}</p>
                    {plan.highlighted ? (
                      <Badge variant="success">Popular</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-growth-mint text-growth-forest">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-growth-sidebar">
            Business Created Successfully
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {createdBusiness?.name || "Your business"} is ready. You can enter
            the dashboard now or start by adding your first services.
          </p>
        </div>
        <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-start text-sm">
          <p className="font-semibold text-growth-sidebar">
            Public booking page
          </p>
          <p className="mt-1 text-muted-foreground">
            {createdBusiness?.publicBookingPath || publicUrlPreview}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={goToDashboard}>
            Go to Dashboard
            <ArrowRight className="ms-2 size-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" onClick={startSetupWizard}>
            Start Setup Wizard
            <ExternalLink className="ms-2 size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-[17rem_1fr]"
      onSubmit={(event) => {
        event.preventDefault();
        if (currentStepIndex === 3) {
          void createBusiness();
        } else if (currentStepIndex < 3) {
          void goNext();
        }
      }}
    >
      <ProgressIndicator
        currentStepIndex={currentStepIndex}
        createdBusiness={createdBusiness}
        onStepSelect={setCurrentStepIndex}
      />

      <section className="rounded-2xl border border-growth-border bg-white p-5 shadow-sm sm:p-6">
        {formik.status ? (
          <div
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            aria-live="polite"
            role="alert"
          >
            {formik.status}
          </div>
        ) : null}

        <div key={currentStep.id} className="space-y-6 animate-stat-rise">
          <StepHeader step={currentStep} headingRef={stepHeadingRef} />
          {renderStepContent()}

          {currentStepIndex < 3 ? (
            <StepActions
              canGoBack={currentStepIndex > 0}
              isSubmitting={formik.isSubmitting}
              onBack={goBack}
              onNext={goNext}
            />
          ) : null}

          {currentStepIndex === 3 ? (
            <div className="flex flex-col-reverse gap-3 border-t border-growth-border pt-5 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={formik.isSubmitting}
                onClick={goBack}
              >
                <ArrowLeft className="me-2 size-4 rtl:rotate-180" aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                disabled={
                  formik.isSubmitting ||
                  currentSlugStatus.state !== "available"
                }
                isLoading={formik.isSubmitting}
                loadingLabel="Creating business..."
                onClick={createBusiness}
              >
                Create Business
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </form>
  );
}
