export function priceToCents(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

export function centsToPrice(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return (value / 100).toFixed(2);
}

