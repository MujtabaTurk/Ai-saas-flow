import * as Yup from "yup";
import {
  AI_GENERATION_TYPES,
  AI_TARGET_LANGUAGES,
  AI_TONES
} from "@/features/ai/constants";

const objectIdSchema = Yup.string()
  .transform((value, originalValue) =>
    originalValue === "" || originalValue === null ? null : value
  )
  .trim()
  .matches(/^[a-f\d]{24}$/i, "Choose a valid service.")
  .nullable()
  .default(null);

export const aiGenerationSchema = Yup.object({
  type: Yup.string()
    .oneOf(Object.values(AI_GENERATION_TYPES), "Choose a valid AI task.")
    .required("AI task is required."),
  prompt: Yup.string()
    .trim()
    .min(3, "Instructions must be at least 3 characters.")
    .max(3000, "Instructions must be 3000 characters or fewer.")
    .required("Instructions are required."),
  serviceId: objectIdSchema,
  targetLanguage: Yup.string()
    .oneOf(
      AI_TARGET_LANGUAGES.map((language) => language.value),
      "Choose a supported target language."
    )
    .nullable()
    .default(null),
  tone: Yup.string()
    .oneOf(AI_TONES, "Choose a valid tone.")
    .default("PROFESSIONAL")
}).test("task-requirements", function validateTaskRequirements(value) {
  if (
    value?.type === AI_GENERATION_TYPES.SERVICE_DESCRIPTION &&
    !value.serviceId
  ) {
    return this.createError({
      path: "serviceId",
      message: "Choose a service for this description."
    });
  }

  if (
    value?.type === AI_GENERATION_TYPES.TRANSLATION &&
    !value.targetLanguage
  ) {
    return this.createError({
      path: "targetLanguage",
      message: "Choose a target language."
    });
  }

  return true;
});

export const aiApprovalSchema = Yup.object({
  approvalStatus: Yup.string()
    .oneOf(["APPROVED", "REJECTED"], "Choose approve or reject.")
    .required("Approval decision is required.")
});
