import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const localesRoot = path.join(projectRoot, "src", "locales");
const settingsFile = path.join(projectRoot, "src", "i18n", "settings.js");
const referenceLanguage = "en";
const sourceRoots = ["src/app", "src/features", "src/components", "src/config"];
const sourceExtensions = new Set([".js", ".jsx"]);
const hardcodedSampleLimit = 25;
const intentionallySharedTerms = new Set([
  "Admin",
  "ADMIN",
  "Basic",
  "Dashboard",
  "Live",
  "MANUAL",
  "Name",
  "Name:",
  "Name A-Z",
  "Plan",
  "Popular",
  "Pro",
  "PRO",
  "FAQ",
  "FAQs",
  "Twitter",
  "LinkedIn",
  "Instagram",
  "YouTube",
  "MC",
  "DB",
  "AR",
  "LM",
  "Maya Chen",
  "Daniel Brooks",
  "Aisha Rahman",
  "Leo Martinez",
  "Elite Fitness Gym",
  "Slug",
  "Status",
  "Team",
  "Team:",
  "VIP",
  "Website",
  "{{count}} min"
]);

function flattenEntries(value, prefix = "") {
  if (Array.isArray(value)) {
    return new Map([[prefix, { type: "array", value }]]);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((shape, [key, child]) => {
      const childPrefix = prefix ? `${prefix}.${key}` : key;

      for (const entry of flattenEntries(child, childPrefix)) {
        shape.set(...entry);
      }

      return shape;
    }, new Map());
  }

  return new Map([[prefix, { type: typeof value, value }]]);
}

function normalizeSourceText(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function parseStringArray(source, exportName) {
  const arrayMatch = source.match(
    new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\];`)
  );

  if (!arrayMatch) {
    return [];
  }

  return [...arrayMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

async function readCatalog(language, namespace) {
  const filename = path.join(localesRoot, language, namespace);
  const source = await readFile(filename, "utf8");

  if (source.includes("\uFFFD")) {
    throw new Error(
      `${language}/${namespace} contains invalid UTF-8 replacement characters.`
    );
  }

  return JSON.parse(source);
}

async function getFilesRecursive(directory) {
  let entries = [];

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return getFilesRecursive(entryPath);
      }

      return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
    })
  );

  return files.flat();
}

function getLineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function isIgnoredCandidate(value) {
  const normalized = normalizeSourceText(value);

  return (
    !normalized ||
    normalized.length < 3 ||
    normalized.startsWith("@/") ||
    normalized.startsWith("/") ||
    normalized.includes("://") ||
    /^[a-z0-9_.:/#?=&\-[\]()*]+$/i.test(normalized) ||
    /^(GET|POST|PATCH|PUT|DELETE|OWNER|ADMIN|CUSTOMER|SUPER_ADMIN)$/i.test(
      normalized
    )
  );
}

function findHardcodedCandidates(source, filename) {
  const candidates = [];
  const relativeFilename = path.relative(projectRoot, filename).replaceAll("\\", "/");
  const patterns = [
    {
      kind: "jsxText",
      regex: />\s*([A-Z][A-Za-z0-9][^<>{}\n]{2,}?)\s*</g,
      valueIndex: 1
    },
    {
      kind: "attribute",
      regex:
        /(aria-label|placeholder|title|alt)=(["'])((?=[A-Z])[^"']{3,})\2/g,
      valueIndex: 3
    },
    {
      kind: "message",
      regex:
        /\b(title|description|message|error|label|placeholder|emptyTitle|emptyDescription|confirmLabel|cancelLabel)\s*:\s*(["'`])((?:\\.|(?!\2)[\s\S]){3,}?)\2/g,
      valueIndex: 3
    }
  ];

  for (const pattern of patterns) {
    let match = pattern.regex.exec(source);

    while (match) {
      const value = normalizeSourceText(match[pattern.valueIndex]);

      if (!isIgnoredCandidate(value) && /[A-Za-z]/.test(value)) {
        candidates.push({
          file: relativeFilename,
          kind: pattern.kind,
          line: getLineNumber(source, match.index),
          value
        });
      }

      match = pattern.regex.exec(source);
    }
  }

  return candidates;
}

function isLikelyUntranslated(value) {
  const normalized = normalizeSourceText(value);
  const textWithoutPlaceholders = normalized
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    /[A-Za-z]/.test(textWithoutPlaceholders) &&
    !intentionallySharedTerms.has(normalized) &&
    !/^ServiceFlow(\s|$)/.test(normalized) &&
    !/^(AI|API|ARR|MRR|OAuth|Prisma|Stripe|Next\.js|MongoDB|React Query|Formik|Yup|Tailwind|shadcn\/ui)$/i.test(
      normalized
    )
  );
}

function sample(values, limit = hardcodedSampleLimit) {
  return [...values].slice(0, limit);
}

const settingsSource = await readFile(settingsFile, "utf8");
const configuredLanguages = [
  ...settingsSource.matchAll(/\{\s*code:\s*"([^"]+)"/g)
]
  .map((match) => match[1])
  .sort();
const namespaces = parseStringArray(settingsSource, "namespaces")
  .map((namespace) => `${namespace}.json`)
  .sort();
const localeDirectories = (await readdir(localesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const report = {
  supportedLanguages: configuredLanguages,
  localeDirectories,
  namespaces,
  totalTranslationKeys: 0,
  missingTranslationsPerLanguage: {},
  likelyUntranslatedPerLanguage: {},
  extraKeysPerLanguage: {},
  typeMismatchesPerLanguage: {},
  hardcodedStrings: {
    scannedFiles: 0,
    totalCandidates: 0,
    coveredByLegacyNamespace: 0,
    remainingUncovered: 0,
    filesUsingLegacyCompatibility: 0,
    sampleRemaining: []
  }
};
const errors = [];

for (const language of configuredLanguages) {
  if (!localeDirectories.includes(language)) {
    errors.push(`${language} locale directory is missing.`);
  }
}

for (const namespace of namespaces) {
  const referenceShape = flattenEntries(
    await readCatalog(referenceLanguage, namespace)
  );

  report.totalTranslationKeys += referenceShape.size;

  for (const language of configuredLanguages) {
    const languageFiles = localeDirectories.includes(language)
      ? await readdir(path.join(localesRoot, language))
      : [];

    if (!languageFiles.includes(namespace)) {
      errors.push(`${language}/${namespace} is missing.`);
      report.missingTranslationsPerLanguage[language] =
        (report.missingTranslationsPerLanguage[language] || 0) +
        referenceShape.size;
      continue;
    }

    const catalogShape = flattenEntries(await readCatalog(language, namespace));

    for (const [key, referenceEntry] of referenceShape) {
      const catalogEntry = catalogShape.get(key);

      if (!catalogEntry) {
        errors.push(`${language}/${namespace} is missing "${key}".`);
        report.missingTranslationsPerLanguage[language] =
          (report.missingTranslationsPerLanguage[language] || 0) + 1;
      } else if (catalogEntry.type !== referenceEntry.type) {
        errors.push(`${language}/${namespace} has the wrong type for "${key}".`);
        report.typeMismatchesPerLanguage[language] =
          (report.typeMismatchesPerLanguage[language] || 0) + 1;
      } else if (
        language !== referenceLanguage &&
        referenceEntry.type === "string" &&
        catalogEntry.value === referenceEntry.value &&
        isLikelyUntranslated(referenceEntry.value)
      ) {
        report.likelyUntranslatedPerLanguage[language] =
          (report.likelyUntranslatedPerLanguage[language] || 0) + 1;
      }
    }

    for (const key of catalogShape.keys()) {
      if (!referenceShape.has(key)) {
        errors.push(`${language}/${namespace} has extra key "${key}".`);
        report.extraKeysPerLanguage[language] =
          (report.extraKeysPerLanguage[language] || 0) + 1;
      }
    }
  }
}

const legacyReference = new Set(
  Object.keys(await readCatalog(referenceLanguage, "legacy.json")).map(
    normalizeSourceText
  )
);
const sourceFiles = (
  await Promise.all(
    sourceRoots.map((sourceRoot) => getFilesRecursive(path.join(projectRoot, sourceRoot)))
  )
).flat();
const hardcodedCandidates = [];

for (const filename of sourceFiles) {
  hardcodedCandidates.push(
    ...findHardcodedCandidates(await readFile(filename, "utf8"), filename)
  );
}

const uniqueHardcoded = new Map();

for (const candidate of hardcodedCandidates) {
  uniqueHardcoded.set(
    `${candidate.file}:${candidate.line}:${candidate.kind}:${candidate.value}`,
    candidate
  );
}

const candidates = [...uniqueHardcoded.values()];
const remainingHardcoded = candidates.filter(
  (candidate) => !legacyReference.has(normalizeSourceText(candidate.value))
);
const filesUsingLegacyCompatibility = new Set(
  candidates
    .filter((candidate) => legacyReference.has(normalizeSourceText(candidate.value)))
    .map((candidate) => candidate.file)
);

report.hardcodedStrings = {
  scannedFiles: sourceFiles.length,
  totalCandidates: candidates.length,
  coveredByLegacyNamespace: candidates.length - remainingHardcoded.length,
  remainingUncovered: remainingHardcoded.length,
  filesUsingLegacyCompatibility: filesUsingLegacyCompatibility.size,
  sampleRemaining: sample(
    remainingHardcoded.map(
      (candidate) =>
        `${candidate.file}:${candidate.line} ${candidate.kind}: ${candidate.value}`
    )
  )
};

for (const language of configuredLanguages) {
  report.missingTranslationsPerLanguage[language] ||= 0;
  report.likelyUntranslatedPerLanguage[language] ||= 0;
  report.extraKeysPerLanguage[language] ||= 0;
  report.typeMismatchesPerLanguage[language] ||= 0;
}

console.log("i18n quality audit");
console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  console.error(`Translation validation failed with ${errors.length} issue(s):`);

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    `Translation validation passed for ${configuredLanguages.length} languages, ${namespaces.length} namespaces, and ${report.totalTranslationKeys} keys.`
  );
}
