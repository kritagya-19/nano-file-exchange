/** Friendly display name when only email is known (e.g. after login). */
export function nameFromEmail(email) {
  const local = (email || "").trim().split("@")[0];
  if (!local) return "User";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
