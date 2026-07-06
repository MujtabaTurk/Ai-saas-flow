"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getTranslatableAttributeNames,
  hasLegacyTranslation,
  translateLegacyText,
  translateLegacyTextWithWhitespace
} from "@/i18n/legacy";

const originalTextNodes = new WeakMap();
const skippedElementNames = new Set([
  "CODE",
  "KBD",
  "NOSCRIPT",
  "PRE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA"
]);

function shouldSkipElement(element) {
  return (
    !element ||
    skippedElementNames.has(element.tagName) ||
    element.closest("[data-i18n-ignore]")
  );
}

function translateTextNode(i18n, node) {
  const parentElement = node.parentElement;

  if (shouldSkipElement(parentElement)) {
    return;
  }

  const currentValue = node.nodeValue || "";
  const record = originalTextNodes.get(node);
  const original =
    record && currentValue !== record.rendered && currentValue !== record.source
      ? currentValue
      : record?.source || currentValue;

  if (!hasLegacyTranslation(i18n, original)) {
    return;
  }

  const translated = translateLegacyTextWithWhitespace(i18n, original);

  originalTextNodes.set(node, {
    rendered: translated,
    source: original
  });

  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
}

function originalAttributeName(attributeName) {
  return `data-i18n-original-${attributeName.replace(/[^a-z0-9-]/gi, "-")}`;
}

function renderedAttributeName(attributeName) {
  return `data-i18n-rendered-${attributeName.replace(/[^a-z0-9-]/gi, "-")}`;
}

function translateAttribute(i18n, element, attributeName) {
  if (shouldSkipElement(element) || !element.hasAttribute(attributeName)) {
    return;
  }

  const originalName = originalAttributeName(attributeName);
  const renderedName = renderedAttributeName(attributeName);
  const currentValue = element.getAttribute(attributeName) || "";
  const storedOriginalValue = element.getAttribute(originalName);
  const storedRenderedValue = element.getAttribute(renderedName);
  const originalValue =
    storedOriginalValue &&
    currentValue !== storedRenderedValue &&
    currentValue !== storedOriginalValue
      ? currentValue
      : storedOriginalValue || currentValue;

  if (!hasLegacyTranslation(i18n, originalValue)) {
    return;
  }

  const translated = translateLegacyText(i18n, originalValue);

  element.setAttribute(originalName, originalValue);
  element.setAttribute(renderedName, translated);

  if (currentValue !== translated) {
    element.setAttribute(attributeName, translated);
  }
}

function translateElement(i18n, element) {
  if (shouldSkipElement(element)) {
    return;
  }

  for (const attributeName of getTranslatableAttributeNames()) {
    translateAttribute(i18n, element, attributeName);
  }

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return shouldSkipElement(node.parentElement)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node = walker.nextNode();

  while (node) {
    translateTextNode(i18n, node);
    node = walker.nextNode();
  }
}

export function LegacyTextTranslator() {
  const { i18n } = useTranslation("legacy");
  const language = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    translateElement(i18n, document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(i18n, mutation.target);
          continue;
        }

        if (mutation.type === "attributes") {
          translateAttribute(i18n, mutation.target, mutation.attributeName);
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(i18n, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateElement(i18n, node);
          }
        }
      }
    });

    observer.observe(document.body, {
      attributeFilter: getTranslatableAttributeNames(),
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [i18n, language]);

  return null;
}
