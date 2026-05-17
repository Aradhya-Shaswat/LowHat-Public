import filter from "leo-profanity";

export function hasProfanity(text: string): boolean {
  if (!text) return false;
  return filter.check(text);
}

export function cleanProfanity(text: string): string {
  if (!text) return text;
  return filter.clean(text);
}

export function validateProfanity(text: string, fieldName: string): string | null {
  if (hasProfanity(text)) {
    return `Profanity is not allowed in ${fieldName}.`;
  }
  return null;
}
