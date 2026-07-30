# Deliverability

Bondery-specific sending policy plus pointers to generic best practices.

## Production setup

- **ESP:** Plunk via SMTP (`BONDERY_PRIVATE_EMAIL_*`)
- **From domain:** Use a dedicated subdomain for transactional mail (e.g. `mail.usebondery.com`) when possible — isolates reputation from root domain and future marketing
- **DNS:** SPF, DKIM, and DMARC configured in Plunk dashboard / DNS provider for the sending domain

## Bondery checklist (before new from-domain or ESP change)

- [ ] SPF/DKIM/DMARC records published and verified in Plunk
- [ ] From address domain matches authenticated sending domain
- [ ] Links and images in templates use same domain as From where possible
- [ ] No link or open tracking on transactional emails
- [ ] No `no-reply@` From — use reply-capable addresses
- [ ] Subprocessor registry and Privacy Policy updated ([bondery-legal](../../bondery-legal/references/subprocessor-registry.md))
- [ ] Test with real mailbox — never intentional hard bounces to fake addresses

## Content limits

- Gmail clips HTML over **102KB** — keep templates lean; avoid heavy images
- Prefer HTML-light transactional emails

## Volume and warmup

Mailbox providers distrust sudden volume spikes. New domains or ESP changes need gradual warmup — coordinate with infra before bulk sends.

## Generic best practices

For vendor-neutral deliverability guidance (subdomains, DMARC details, testing):

- [Resend: Top 10 email deliverability tips](https://resend.com/blog/top-10-email-deliverability-tips)
- Upstream `email-best-practices` skill (`.agents/skills/email-best-practices/SKILL.md`)

## Bounces and complaints

Today: handled by Plunk/SMTP provider; no in-app bounce webhook ingestion. Document as future work if migrating to Resend API or adding suppression lists.

## TLS

Use correct port/TLS settings for Plunk — see [sending-and-env.md](./sending-and-env.md). Misconfigured TLS can cause intermittent delivery failures.
