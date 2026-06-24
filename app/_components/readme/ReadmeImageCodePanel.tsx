"use client";

import React from "react";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";

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

const COPIED_FEEDBACK_DURATION_MS = 2000;

type ReadmeImageCodePanelProps = {
  emptyPlaceholder?: string;
  readmeImageCode: string;
} & (
  | { showCopyButton?: true; onCopy: () => Promise<boolean> }
  | { showCopyButton: false; onCopy?: never }
);

export function ReadmeImageCodePanel({
  emptyPlaceholder,
  readmeImageCode,
  showCopyButton = true,
  ...copyProps
}: ReadmeImageCodePanelProps) {
  const [isCodeVisible, setIsCodeVisible] = React.useState(true);
  const [isCopied, setIsCopied] = React.useState(false);
  const copiedResetTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const codeBlockId = React.useId();
  const hasReadmeImageCode = readmeImageCode !== "";

  React.useEffect(() => {
    return () => {
      if (copiedResetTimeoutRef.current !== null) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  async function copyWithCopiedFeedback() {
    if (!showCopyButton) {
      return;
    }

    if (!(await copyProps.onCopy())) {
      return;
    }

    setIsCopied(true);

    if (copiedResetTimeoutRef.current !== null) {
      clearTimeout(copiedResetTimeoutRef.current);
    }

    copiedResetTimeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, COPIED_FEEDBACK_DURATION_MS);
  }

  return (
    <div className="mx-5 mb-5">
      <button
        aria-controls={isCodeVisible ? codeBlockId : undefined}
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
      {isCodeVisible ? (
        <div className="relative mt-3">
          <pre
            aria-label="README image code"
            className="max-w-full overflow-x-auto whitespace-pre rounded-[6px] border border-code-bg-2 bg-code-bg px-4 py-[15px] font-mono text-[12.5px] leading-[1.75]"
            id={codeBlockId}
          >
            {hasReadmeImageCode ? (
              <code>
                {tokenizeReadmeImageCode(readmeImageCode).map(
                  (token, index) => (
                    <span
                      className={
                        TOKEN_KIND_CLASS_NAMES[token.kind] || undefined
                      }
                      key={index}
                    >
                      {token.text}
                    </span>
                  ),
                )}
              </code>
            ) : (
              <code className="text-syntax-punctuation">
                {emptyPlaceholder ?? ""}
              </code>
            )}
          </pre>
          {showCopyButton ? (
            <button
              aria-label={isCopied ? "Copied" : "Copy README code"}
              aria-live="polite"
              className={cn(
                "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-[6px] border bg-surface-3 transition-[color] disabled:pointer-events-none disabled:opacity-45",
                isCopied ? "text-accent-ink" : "text-ink-2 hover:text-ink",
              )}
              disabled={!hasReadmeImageCode}
              onClick={copyWithCopiedFeedback}
              type="button"
            >
              {isCopied ? (
                <CheckIcon aria-hidden="true" size={15} />
              ) : (
                <CopyIcon aria-hidden="true" size={15} />
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
