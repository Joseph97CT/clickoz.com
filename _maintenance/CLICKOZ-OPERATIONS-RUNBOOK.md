# Clickoz Operations Runbook

Use this runbook for production changes to Clickoz.com. The project is mostly static: HTML, CSS, client JavaScript, generated tool pages and one lightweight Vercel API endpoint for client error events.

## Environments

- Local preview: run the static server from the repository root and test the smoke paths.
- Test deployment: use a Vercel preview deployment from a pull request.
- Production: deploy the `main` branch after the quality gate passes.

## Deploy From GitHub

1. Push changes to a feature branch.
2. Open a pull request.
3. Wait for `Clickoz quality gate` to pass.
4. Open the Vercel preview URL and check the smoke paths on desktop and mobile.
5. Merge to `main` only after the audit is clean.
6. Let Vercel publish production from `main`.

## Rollback

Use Vercel instant rollback when a production deploy breaks navigation, tools, layout, monitoring or SEO output.

1. Open the Vercel project.
2. Go to Deployments.
3. Select the last known working production deployment.
4. Promote it to production.
5. Create a follow-up fix branch instead of editing production directly.
6. Run the quality gate before redeploying.

If the issue is caused by a cached asset, bump the matching version in `_maintenance/cms-config.js` and update generated/static HTML references through the existing generators or a reviewed mechanical replacement.

## Error Monitoring

- Client runtime errors are captured by `assets/site.js`.
- Recent sanitized events are kept in the browser under `clickoz_ops_events`.
- Production events post to `/api/client-error` and appear in Vercel function logs as `clickoz-client-event`.
- The event payload excludes tool input, pasted text and generated output.
- Remote event sending is rate-limited in the browser and again in `api/client-error.js`.
- `api/client-error.js` accepts only bounded JSON/text POST payloads from Clickoz origins and strips query strings from source paths.
- In the browser console, `ClickozOps.status()` shows whether the guard is active.
- `ClickozOps.events()` returns the local diagnostic buffer.

## Anti-Bot Baseline

- Forms receive a hidden honeypot field at runtime.
- Suspicious form bursts are blocked client-side.
- Very fast repeated interactions are reported and extreme bursts are blocked.
- Server-side endpoints must keep request-size limits and method checks. `api/client-error.js` accepts only small POST events.

This is baseline abuse reduction, not a replacement for Cloudflare Turnstile, WAF rules or rate limiting on future write endpoints.

## Security Structure

- `_maintenance/cms-config.js` owns the canonical CSP, CSP header value, Permissions-Policy and asset versions.
- `vercel.json` must stay synced with those values. Run `node _maintenance\sync-security-assets.js` after changing CSP, Permissions-Policy or asset versions.
- HTML pages use the meta CSP from `_maintenance/cms-config.js`; the Vercel response header adds `frame-ancestors 'self'`.
- `_maintenance/audit-site.js` fails when security headers, CSP fragments, API no-store headers or HTML security meta are out of sync.
- Do not add third-party scripts, frames, APIs or fonts without updating CSP in `_maintenance/cms-config.js` and documenting the reason in the change.

## Cloudflare, SSL, DNS And Cache

- Use Cloudflare DNS proxy for `clickoz.com` and `www.clickoz.com`.
- Keep SSL mode at Full strict.
- Keep HTTPS redirects enabled.
- Cache static assets aggressively. The repo already serves `/assets/*` and tool JS with immutable caching.
- Keep HTML revalidation fast so Vercel rollback can take effect quickly.
- Do not cache `/api/client-error`; it returns `Cache-Control: no-store`.

## Scalability

- Keep tools browser-first. Avoid server work for text processing, generation previews and local history.
- Keep shared assets versioned and immutable.
- Avoid adding third-party scripts unless they are essential and allowed in CSP.
- Prefer generated static pages for SEO landing pages, tool hubs and guide hubs.
- Keep API routes small, bounded and stateless.
- Use Cloudflare and Vercel analytics/logs to watch spikes before adding paid infrastructure.

## SEO Release Checks

- Run `_maintenance/audit-site.js`.
- Confirm `sitemap.xml` includes all canonical tools, hubs and guides.
- Confirm `robots.txt` does not block indexed CMS pages.
- Check title, description and schema on `/`, `/tools/`, major hubs and new pages.
- Add landing pages only when the intent is real and the page has unique value.

## QA Smoke Gate

Check these paths before production:

- `/`
- `/tools/`
- `/tools/seo-tools/`
- `/tools/word-counter/`
- `/tools/json-formatter/`
- `/tools/youtube-title-generator/`
- `/guides/`
- `/updates/`
- `/contact/`
- `/404/`

For each path, verify desktop and mobile layout, navigation, contrast, primary actions, console errors, broken links and visible 404 recovery.
