export function businessWideServiceScopeWhere() {
  return {
    OR: [
      { serviceId: null },
      { serviceId: { isSet: false } }
    ]
  };
}

export function exactServiceScopeWhere(serviceId) {
  return serviceId
    ? { serviceId }
    : businessWideServiceScopeWhere();
}

export function serviceOrBusinessWideScopeWhere(serviceId) {
  return {
    OR: [
      { serviceId },
      { serviceId: null },
      { serviceId: { isSet: false } }
    ]
  };
}
