import { validateRequest } from "@/lib/api/validate-request";

export async function readJsonRequest(request) {
  return request.json().catch(() => null);
}

export async function validateJsonRequest(request, schema) {
  const payload = await readJsonRequest(request);

  return validateRequest(schema, payload || {});
}
