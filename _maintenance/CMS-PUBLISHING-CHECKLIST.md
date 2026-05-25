# Clickoz CMS Publishing Checklist

Use this when adding or changing Clickoz tools, guides, clusters, metadata, or generated pages. The CMS is static and data-driven; do not introduce backend behavior or a panel admin in this 30-day consolidation cycle.

## Source Of Truth

- CMS registry: `assets/cms-registry.js`
- Tool runtime: `tools/cms-tools.js`
- Schema layer: `assets/cms-schema.js`
- UI enhancer: `assets/cms-enhance.js`
- Shared maintenance config: `_maintenance/cms-config.js`
- Security/asset sync: `_maintenance/sync-security-assets.js`
- Audit gate: `_maintenance/audit-site.js`
- Operations runbook: `_maintenance/CLICKOZ-OPERATIONS-RUNBOOK.md`
- Client error endpoint: `api/client-error.js`

## Publish Flow

1. Edit the CMS registry only for real tool, guide, cluster, relationship, or canonical changes.
2. Keep the public `window.ClickozCMS` shape stable: `clusters`, `tools`, `guides`, `toolBySlug`, `guideBySlug`, and `findByPath`.
3. Add real descriptions, features, related tools, related guides, and canonical slugs. Do not add placeholder or fake content.
4. Regenerate only the page family that needs it:
   - Tools and cluster pages: `node _maintenance\generate-all-tools.js`
   - Guide pages: `node _maintenance\generate-premium-guides.js`
5. Review generated diffs before publishing. Regeneration touches many pages, so treat it as a risky change.
6. If CSP, Permissions-Policy or asset versions changed, run `node _maintenance\sync-security-assets.js`.
7. Run the validation commands below.

## Validation Commands

```powershell
node --check assets\cms-registry.js
node --check assets\cms-schema.js
node --check assets\cms-enhance.js
node --check tools\cms-tools.js
node --check _maintenance\cms-config.js
node --check _maintenance\sync-security-assets.js
node --check _maintenance\audit-site.js
node --check _maintenance\generate-all-tools.js
node --check _maintenance\generate-premium-guides.js
node --check api\client-error.js
node _maintenance\audit-site.js
```

## Smoke Paths

Check these on desktop and mobile after any shared UI, runtime, or generated-page change:

- `/`
- `/tools/`
- `/tools/seo-tools/`
- `/tools/word-counter/`
- `/tools/json-formatter/`
- `/tools/youtube-title-generator/`
- `/guides/`
- `/guides/word-count-for-seo/`
- `/updates/`
- `/404/`

Confirm each page has visible navigation, stable layout, no text overflow, working primary actions, no blank result areas, and expected CMS assets.

For production releases, also confirm `ClickozOps.status()` reports an active guard in the browser console and review `_maintenance/CLICKOZ-OPERATIONS-RUNBOOK.md` for rollback steps.

## Acceptance Criteria

- Audit report returns `"ok": true`.
- No CMS page is missing.
- No local links are broken.
- No registry placeholders or unresolved related links exist.
- Sitemap includes all canonical CMS pages.
- Robots does not block indexed CMS paths.
- Vercel headers, HTML security meta and API no-store headers pass the audit.
- Tool pages keep copy, local history, empty state, example loading, and output rendering working.

## Backlog After Consolidation

- Consider a panel admin only after the static CMS has stable validation and repeatable publishing.
- Add browser-based automated smoke coverage if UI changes become frequent.
- Add stricter type generation only if the registry grows enough to justify the maintenance cost.
