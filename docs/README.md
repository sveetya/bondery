# Bondery Documentation

> Your open-source network manager

Bondery helps you manage your network of contacts effortlessly. Whether you're looking to keep in touch with friends, family, or professional connections, Bondery provides the tools you need to stay organized and connected.

**Live app:** [usebondery.com](https://usebondery.com)
**Source code:** [github.com/usebondery/bondery](https://github.com/usebondery/bondery)

## Who is this documentation for?

- **Contributors** looking to set up the project locally and start developing
- **API consumers** integrating with the Bondery REST API
- **DevOps / deployers** managing production infrastructure
- **AI agents** that need structured context about the codebase

## Documentation structure

| Section | Description |
|---|---|
| [Getting Started](getting-started/README.md) | Prerequisites, installation, environment setup |
| [Architecture](architecture/README.md) | High-level architecture, monorepo layout, tech stack |
| [API Reference](api/README.md) | REST API documentation with OpenAPI spec |
| [Database](database/README.md) | Schema, RLS policies, functions, migrations |
| [Applications](apps/webapp.md) | Webapp, website, chrome extension details |
| [Packages](packages/README.md) | Shared packages overview |
| [Deployment](deployment/README.md) | Release process and CI/CD |

## Quick links

- [OpenAPI Specification](api/openapi.yaml) -- machine-readable API definition
- [Environment Variables](getting-started/environment-variables.md) -- all env vars across apps
- [Database Schema](database/schema.md) -- complete table definitions
- [Tech Stack](architecture/tech-stack.md) -- all technologies used

## License

Bondery is open-source software licensed under the [AGPL-3.0 license](../LICENSE).
