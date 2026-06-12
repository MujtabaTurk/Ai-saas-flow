export function isValidMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(value || "");
}
