"use client";

import React from "react";
import { ChevronDownIcon, CopyIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER =
  "<!-- add icons to generate code -->";
export const FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER =
  "<!-- fix the validation errors above to generate code -->";

export type ReadmeImageCodeTokenKind =
  | "attribute"
  | "punctuation"
  | "string"
  | "tag"
  | "text";

export type ReadmeImageCodeToken = {
  kind: ReadmeImageCodeTokenKind;
  text: string;
};

// Matches the README image code shapes renderReadmeHtml emits: tag openers,
// attribute="value" pairs, tag closers, and a catch-all single character so
// concatenating every token always reproduces the input exactly.
const README_IMAGE_CODE_TOKEN_PATTERN =
  /(<\/?)([a-zA-Z][\w-]*)|([a-zA-Z][\w-]*)(=)(")([^"]*)(")|(\/?>)|([\s\S])/g;

// Splits README image code into syntax-highlighting tokens. The token texts
// concatenate back to the exact input, so a highlighted render's text content
// always equals the clipboard payload.
export function tokenizeReadmeImageCode(
  readmeImageCode: string,
): ReadmeImageCodeToken[] {
  const tokens: ReadmeImageCodeToken[] = [];

  for (const match of readmeImageCode.matchAll(
    README_IMAGE_CODE_TOKEN_PATTERN,
  )) {
    const [
      ,
      tagOpener,
      tagName,
      attributeName,
      equalsSign,
      openingQuote,
      attributeValue,
      closingQuote,
      tagCloser,
      otherCharacter,
    ] = match;

    if (tagOpener !== undefined) {
      tokens.push(
        { kind: "punctuation", text: tagOpener },
        { kind: "tag", text: tagName },
      );
      continue;
    }

    if (attributeName !== undefined) {
      tokens.push(
        { kind: "attribute", text: attributeName },
        { kind: "punctuation", text: equalsSign },
        { kind: "punctuation", text: openingQuote },
        { kind: "string", text: attributeValue },
        { kind: "punctuation", text: closingQuote },
      );
      continue;
    }

    if (tagCloser !== undefined) {
      tokens.push({ kind: "punctuation", text: tagCloser });
      continue;
    }

    tokens.push({
      kind: /[<>="/]/.test(otherCharacter) ? "punctuation" : "text",
      text: otherCharacter,
    });
  }

  return tokens;
}

const TOKEN_KIND_CLASS_NAMES: Record<ReadmeImageCodeTokenKind, string> = {
  attribute: "text-syntax-attribute",
  punctuation: "text-syntax-punctuation",
  string: "text-syntax-string",
  tag: "text-syntax-tag",
  text: "",
};

type ReadmeImageCodePanelProps = {
  hasSelectedIcons: boolean;
  onCopy: () => void;
  readmeImageCode: string;
};

// Bottom panel of the column layout preview card: a collapsible, syntax
// highlighted view of the generated README image code with a copy button.
// Disclosure state is ephemeral UI state; copying works even while the code
// is collapsed because the clipboard payload is the generated string itself.
export function ReadmeImageCodePanel({
  hasSelectedIcons,
  onCopy,
  readmeImageCode,
}: ReadmeImageCodePanelProps) {
  const [isCodeVisible, setIsCodeVisible] = React.useState(true);
  const hasReadmeImageCode = readmeImageCode !== "";

  return (
    <div className="mx-5 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          aria-controls="readme-image-code-block"
          aria-expanded={isCodeVisible}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.07em] text-ink-2"
          onClick={() => setIsCodeVisible((isVisible) => !isVisible)}
          type="button"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "h-[13px] w-[13px] transition-transform duration-[180ms]",
              !isCodeVisible && "-rotate-90",
            )}
          />
          {"README code · <picture>"}
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent px-[13px] py-[7px] text-[13px] font-semibold text-white disabled:opacity-45"
          disabled={!hasReadmeImageCode}
          onClick={onCopy}
          type="button"
        >
          <CopyIcon aria-hidden="true" className="h-3.5 w-3.5" />
          Copy README code
        </button>
      </div>
      {isCodeVisible ? (
        <pre
          aria-label="README image code"
          className="mt-3 max-w-full overflow-x-auto whitespace-pre rounded-[6px] border border-code-bg-2 bg-code-bg px-4 py-[15px] font-mono text-[12.5px] leading-[1.75]"
          id="readme-image-code-block"
        >
          {hasReadmeImageCode ? (
            <code>
              {tokenizeReadmeImageCode(readmeImageCode).map((token, index) => (
                <span
                  className={TOKEN_KIND_CLASS_NAMES[token.kind] || undefined}
                  key={index}
                >
                  {token.text}
                </span>
              ))}
            </code>
          ) : (
            <code className="text-syntax-punctuation">
              {hasSelectedIcons
                ? FIX_ERRORS_README_IMAGE_CODE_PLACEHOLDER
                : ADD_ICONS_README_IMAGE_CODE_PLACEHOLDER}
            </code>
          )}
        </pre>
      ) : null}
    </div>
  );
}
