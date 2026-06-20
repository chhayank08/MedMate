/**
 * Pull the first balanced JSON object/array out of a (possibly fenced) string.
 * Shared by the router's structured-output path. Extracted from the original
 * openrouter client so any provider's text can be parsed the same way.
 */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.search(/[[{]/);
  if (start === -1) return candidate;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === open) depth++;
    else if (candidate[i] === close && --depth === 0) {
      return sanitizeControlChars(candidate.slice(start, i + 1));
    }
  }
  return sanitizeControlChars(candidate.slice(start));
}

/**
 * Best-effort repair of a TRUNCATED JSON candidate (the model hit its token cap
 * mid-output → "Unterminated string in JSON"). Strategy: rewind to the last
 * fully-closed structural element, then close any still-open brackets. For the
 * common `{"title":…,"items":[ {…},{…},{partial` shape this drops the incomplete
 * trailing element and yields a valid object with the items that DID complete —
 * so a slightly-truncated batch still produces usable data instead of throwing.
 * Returns `null` when nothing complete can be salvaged.
 */
export function repairJson(candidate: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let cut = -1; // index AFTER the last COMPLETE array element
  let cutStack: string[] = []; // bracket stack state at that point

  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      stack.pop();
      // Only a safe truncation point if we just finished an element that sits
      // DIRECTLY inside an array — i.e. a whole array item completed. Cutting
      // after an inner value (e.g. an object's `options:[…]`) would leave that
      // object missing required fields and fail schema validation.
      if (stack[stack.length - 1] === "[") {
        cut = i + 1;
        cutStack = [...stack];
      }
    }
  }

  if (cut === -1) return null; // no complete array element to keep
  let repaired = candidate.slice(0, cut);
  for (let i = cutStack.length - 1; i >= 0; i--) {
    repaired += cutStack[i] === "{" ? "}" : "]";
  }
  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    return null;
  }
}

/**
 * Parse model text as JSON, tolerating a truncated tail. Tries the balanced
 * extraction first; on failure attempts a structural repair. Throws the ORIGINAL
 * parse error (e.g. "Unterminated string in JSON…") when unrecoverable, so the
 * caller's repair/retry path still sees a meaningful message.
 */
export function parseJsonLoose(text: string): unknown {
  const candidate = extractJson(text);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    const repaired = repairJson(candidate);
    if (repaired !== null) {
      try {
        return JSON.parse(repaired);
      } catch {
        /* fall through to original error */
      }
    }
    throw err;
  }
}

/**
 * Some models (Gemini) emit literal control characters inside JSON string
 * values instead of the proper escape sequences. `JSON.parse` rejects them.
 * We fix them by scanning only inside string literals and escaping any bare
 * control character found there.
 */
function sanitizeControlChars(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch.charCodeAt(0) < 0x20) {
      // Bare control character inside a JSON string — escape it.
      switch (ch) {
        case "\n": result += "\\n"; break;
        case "\r": result += "\\r"; break;
        case "\t": result += "\\t"; break;
        default:   result += `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`; break;
      }
      continue;
    }

    result += ch;
  }

  return result;
}
