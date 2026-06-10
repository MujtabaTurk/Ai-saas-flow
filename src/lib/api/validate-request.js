import { ValidationError } from "yup";

export async function validateRequest(schema, payload) {
  try {
    return {
      data: await schema.validate(payload, {
        abortEarly: false,
        stripUnknown: true
      }),
      errors: null
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        data: null,
        errors: error.inner.reduce((acc, item) => {
          if (item.path && !acc[item.path]) {
            acc[item.path] = item.message;
          }

          return acc;
        }, {})
      };
    }

    throw error;
  }
}

