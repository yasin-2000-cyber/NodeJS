import { z } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        details: result.error.issues.map(i => ({
          path: i.path.join("."),
          message: i.message
        }))
      });
    }
    req.validated = result.data;
    next();
  };
}

export const zId = z.string().regex(/^\d+$/, "Must be a numeric id");

