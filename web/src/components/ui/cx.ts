/** Concatène des classes en ignorant les valeurs vides. */
export function cx(...parts: (string | false | null | undefined | 0)[]) {
  return parts.filter(Boolean).join(" ");
}
