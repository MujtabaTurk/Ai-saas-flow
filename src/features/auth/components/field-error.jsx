export function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="text-sm font-medium text-red-600">{children}</p>;
}

