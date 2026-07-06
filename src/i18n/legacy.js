const translatableAttributeNames = [
  "aria-label",
  "placeholder",
  "title",
  "alt"
];
const legacyPatternCache = new Map();
const templatePlaceholderPattern = /\$\{[^}]+\}/g;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileLegacyPattern(source) {
  const parts = [];
  let lastIndex = 0;
  templatePlaceholderPattern.lastIndex = 0;
  let match = templatePlaceholderPattern.exec(source);

  while (match) {
    parts.push(escapeRegExp(source.slice(lastIndex, match.index)));
    parts.push("(.+?)");
    lastIndex = match.index + match[0].length;
    match = templatePlaceholderPattern.exec(source);
  }

  parts.push(escapeRegExp(source.slice(lastIndex)));
  templatePlaceholderPattern.lastIndex = 0;

  return new RegExp(`^${parts.join("")}$`, "u");
}

function getLegacyPatterns(i18n) {
  const language = i18n?.resolvedLanguage || i18n?.language || "";
  const cacheKey = `${language}:${i18n?.isInitialized ? "ready" : "pending"}`;

  if (legacyPatternCache.has(cacheKey)) {
    return legacyPatternCache.get(cacheKey);
  }

  const bundle = i18n?.getResourceBundle?.(language, "legacy") || {};
  const patterns = Object.entries(bundle)
    .filter(([source]) => source.includes("${"))
    .map(([source, template]) => {
      templatePlaceholderPattern.lastIndex = 0;

      return {
        regex: compileLegacyPattern(normalizeLegacySource(source)),
        template: String(template)
      };
    });

  templatePlaceholderPattern.lastIndex = 0;
  legacyPatternCache.set(cacheKey, patterns);

  return patterns;
}

function interpolateLegacyPattern(template, captures) {
  let index = 0;

  return template.replace(templatePlaceholderPattern, () => captures[index++] || "");
}

export function normalizeLegacySource(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function resolveLegacyText(i18n, value) {
  const source = normalizeLegacySource(value);

  if (!source) {
    return null;
  }

  if (i18n?.exists?.(source, { keySeparator: false, ns: "legacy" })) {
    return i18n.t(source, {
      defaultValue: source,
      keySeparator: false,
      ns: "legacy"
    });
  }

  for (const { regex, template } of getLegacyPatterns(i18n)) {
    const match = source.match(regex);

    if (match) {
      return interpolateLegacyPattern(template, match.slice(1));
    }
  }

  return null;
}

export function hasLegacyTranslation(i18n, value) {
  return resolveLegacyText(i18n, value) !== null;
}

export function translateLegacyText(i18n, value) {
  const translated = resolveLegacyText(i18n, value);

  return translated === null ? value : translated;
}

export function translateLegacyTextWithWhitespace(i18n, value) {
  if (typeof value !== "string") {
    return value;
  }

  const source = normalizeLegacySource(value);

  const translated = resolveLegacyText(i18n, source);

  if (translated === null) {
    return value;
  }

  const leadingWhitespace = value.match(/^\s*/)?.[0] || "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] || "";

  return `${leadingWhitespace}${translated}${trailingWhitespace}`;
}

export function getTranslatableAttributeNames() {
  return translatableAttributeNames;
}
