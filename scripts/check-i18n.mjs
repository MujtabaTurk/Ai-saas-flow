import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const localesRoot = path.join(process.cwd(), "src", "locales");
const referenceLanguage = "en";

function flattenShape(value, prefix = "") {
  if (Array.isArray(value)) {
    return new Map([[prefix, "array"]]);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((shape, [key, child]) => {
      const childPrefix = prefix ? `${prefix}.${key}` : key;

      for (const entry of flattenShape(child, childPrefix)) {
        shape.set(...entry);
      }

      return shape;
    }, new Map());
  }

  return new Map([[prefix, typeof value]]);
}

async function readCatalog(language, namespace) {
  const filename = path.join(localesRoot, language, namespace);
  const source = await readFile(filename, "utf8");

  if (source.includes("\uFFFD")) {
    throw new Error(`${language}/${namespace} contains invalid UTF-8 replacement characters.`);
  }

  return JSON.parse(source);
}

const languages = (await readdir(localesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const namespaces = (await readdir(path.join(localesRoot, referenceLanguage)))
  .filter((filename) => filename.endsWith(".json"))
  .sort();
const errors = [];

for (const namespace of namespaces) {
  const referenceShape = flattenShape(
    await readCatalog(referenceLanguage, namespace)
  );

  for (const language of languages) {
    const languageFiles = await readdir(path.join(localesRoot, language));

    if (!languageFiles.includes(namespace)) {
      errors.push(`${language}/${namespace} is missing.`);
      continue;
    }

    const catalogShape = flattenShape(
      await readCatalog(language, namespace)
    );

    for (const [key, type] of referenceShape) {
      if (!catalogShape.has(key)) {
        errors.push(`${language}/${namespace} is missing "${key}".`);
      } else if (catalogShape.get(key) !== type) {
        errors.push(
          `${language}/${namespace} has the wrong type for "${key}".`
        );
      }
    }

    for (const key of catalogShape.keys()) {
      if (!referenceShape.has(key)) {
        errors.push(`${language}/${namespace} has extra key "${key}".`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Translation validation failed with ${errors.length} issue(s):`);

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    `Translation validation passed for ${languages.length} languages and ${namespaces.length} namespaces.`
  );
}
