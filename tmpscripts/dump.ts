import * as fs from "node:fs/promises";
import * as c from "../src/lib/content";
import * as d from "../src/lib/directory";
import * as b from "../src/lib/bound";

const out = {
  categories: c.DEFAULT_CATEGORIES,
  articles: c.DEFAULT_ARTICLES,
  announcements: c.DEFAULT_ANNOUNCEMENTS,
  faqs: c.DEFAULT_FAQS,
  schools: d.DEFAULT_SCHOOLS,
  programs: d.DEFAULT_PROGRAMS,
  events: d.DEFAULT_EVENTS,
  contacts: d.DEFAULT_CONTACTS,
  sources: d.DEFAULT_SOURCES,
  activities: b.INITIAL_BOUND_ACTIVITIES,
};
await fs.writeFile("/tmp/defaults.json", JSON.stringify(out));
console.log(
  Object.entries(out)
    .map(([k, v]) => `${k}:${(v as unknown[]).length}`)
    .join(" "),
);
