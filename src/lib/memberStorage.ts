import type { Member } from "./index";

export const memberStorage = {
  async search(query: string): Promise<Member[]> {
    const response = await fetch(
      `/api/members?q=${encodeURIComponent(query.trim())}`,
      { credentials: "include", headers: { Accept: "application/json" } },
    );
    if (!response.ok)
      throw new Error(`Member search failed: ${response.status}`);
    const payload = (await response.json()) as { users?: Member[] };
    return Array.isArray(payload.users) ? payload.users : [];
  },
};
