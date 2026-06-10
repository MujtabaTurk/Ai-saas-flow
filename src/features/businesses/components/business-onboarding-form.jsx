"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_INDUSTRIES,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";
import { createSlugFromName, normalizeBusinessSlug } from "@/features/businesses/slug";
import { businessOnboardingSchema } from "@/features/businesses/validation/onboarding-schema";
import { FieldError } from "@/features/auth/components/field-error";

function SelectField({ children, className = "", ...props }) {
  return (
    <select
      className={`flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function BusinessOnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState({
    slug: "",
    state: "idle",
    message: ""
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      industry: "salon_spa",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      country: "PK",
      website: "",
      timezone: "Asia/Karachi",
      currency: "usd",
      locale: "en"
    },
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
        helpers.setStatus(payload?.error?.message || "Could not create your business workspace.");
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      await update();
      router.push("/dashboard");
      router.refresh();
    }
  });

  const publicUrlPreview = useMemo(() => {
    const slug = normalizeBusinessSlug(formik.values.slug);

    return slug ? `/${slug}` : "/your-business";
  }, [formik.values.slug]);

  const normalizedSlug = normalizeBusinessSlug(formik.values.slug);
  const canCheckSlug = normalizedSlug.length >= 3 && !formik.errors.slug;
  const currentSlugStatus = canCheckSlug && slugStatus.slug === normalizedSlug
    ? slugStatus
    : {
        slug: normalizedSlug,
        state: "idle",
        message: ""
      };

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
          message: payload.data.available ? "This public URL is available." : "This public URL is already taken."
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

    if (!slugEdited) {
      formik.setFieldValue("slug", createSlugFromName(event.target.value));
    }
  }

  function handleSlugChange(event) {
    setSlugEdited(true);
    formik.setFieldValue("slug", normalizeBusinessSlug(event.target.value));
  }

  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <Badge>Step 1</Badge>
            <h2 className="mt-3 text-xl font-bold text-growth-sidebar">Business basics</h2>
            <p className="text-sm text-muted-foreground">
              Set the tenant identity customers will see on the public booking page.
            </p>
          </div>

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
              <FieldError>{formik.touched.name && formik.errors.name}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Public booking slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="fresh-glow-studio"
                value={formik.values.slug}
                onBlur={formik.handleBlur}
                onChange={handleSlugChange}
              />
              <FieldError>{formik.touched.slug && formik.errors.slug}</FieldError>
              {currentSlugStatus.message ? (
                <p
                  className={
                    currentSlugStatus.state === "available"
                      ? "text-sm font-medium text-emerald-700"
                      : "text-sm font-medium text-amber-700"
                  }
                >
                  {currentSlugStatus.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
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
              <FieldError>{formik.touched.industry && formik.errors.industry}</FieldError>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <Badge>Step 2</Badge>
            <h2 className="mt-3 text-xl font-bold text-growth-sidebar">Contact, location, and locale</h2>
            <p className="text-sm text-muted-foreground">
              These defaults keep bookings, payments, and customer messages consistent.
            </p>
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
              <FieldError>{formik.touched.email && formik.errors.email}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+92 300 0000000"
                value={formik.values.phone}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.phone && formik.errors.phone}</FieldError>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                placeholder="Office, studio, or street address"
                value={formik.values.addressLine1}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.addressLine1 && formik.errors.addressLine1}</FieldError>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                placeholder="Suite, floor, area, or landmark"
                value={formik.values.addressLine2}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.addressLine2 && formik.errors.addressLine2}</FieldError>
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
              <FieldError>{formik.touched.city && formik.errors.city}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <SelectField
                id="country"
                name="country"
                value={formik.values.country}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </SelectField>
              <FieldError>{formik.touched.country && formik.errors.country}</FieldError>
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
              <FieldError>{formik.touched.website && formik.errors.website}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <SelectField
                id="timezone"
                name="timezone"
                value={formik.values.timezone}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                {SUPPORTED_TIMEZONES.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </SelectField>
              <FieldError>{formik.touched.timezone && formik.errors.timezone}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <SelectField
                id="currency"
                name="currency"
                value={formik.values.currency}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency.toUpperCase()}
                  </option>
                ))}
              </SelectField>
              <FieldError>{formik.touched.currency && formik.errors.currency}</FieldError>
            </div>

            <div className="space-y-2 md:col-span-2">
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
              <FieldError>{formik.touched.locale && formik.errors.locale}</FieldError>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <Badge>Step 3</Badge>
            <h2 className="mt-3 text-xl font-bold text-growth-sidebar">Review and create</h2>
          </div>

          <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm">
            <p className="font-semibold text-growth-sidebar">Public booking URL preview</p>
            <p className="mt-1 text-muted-foreground">{publicUrlPreview}</p>
          </div>

          <div className="rounded-2xl border border-growth-border bg-growth-mint/30 p-4 text-sm text-growth-sidebar">
            A 14-day Trial subscription, default booking policy, and weekday 9:00-17:00 availability
            will be created automatically for this business.
          </div>

          <Button
            className="w-full"
            disabled={formik.isSubmitting || currentSlugStatus.state !== "available"}
            type="submit"
          >
            {formik.isSubmitting ? "Creating workspace..." : "Create business workspace"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
