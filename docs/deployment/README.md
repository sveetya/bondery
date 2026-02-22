# Deployment Overview

Bondery consists of multiple deployable units, each with its own deployment target:

| App | Hosting | URL |
|---|---|---|
| Website | Vercel | `usebondery.com` |
| API | Vercel (serverless) | `api.usebondery.com` |
| Webapp | Vercel | `app.usebondery.com` |
| Database | Supabase Cloud | Managed PostgreSQL |
| Chrome Extension | Chrome Web Store | Via GitHub Actions |

## Deployment flow

```mermaid
graph LR
    subgraph development [Development]
        Code[Code changes]
        Migrations[DB migrations]
    end

    subgraph ci [CI/CD]
        Vercel[Vercel auto-deploy]
        GHA[GitHub Actions]
    end

    subgraph production [Production]
        WebsiteProd[Website]
        WebappProd[Webapp]
        APIProd[API]
        DBProd[Supabase DB]
        CWSProd[Chrome Web Store]
    end

    Code -->|push to main| Vercel
    Code -->|tag ext-v*| GHA
    Migrations -->|supabase db push| DBProd
    Vercel --> WebsiteProd
    Vercel --> WebappProd
    Vercel --> APIProd
    GHA --> CWSProd
```

## Key processes

- [Release Process](release-process.md) -- how to release a new version
- [CI/CD](ci-cd.md) -- GitHub Actions workflows
