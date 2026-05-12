# README Rewrite Plan

## Scope

- Rewrite `backend/README.md` with Tijaratk-specific backend setup and operations documentation.
- Rewrite `frontend/README.md` with Tijaratk-specific frontend setup and architecture documentation.
- Do not add the root `README.md` in this pass; add it later as a separate project-level documentation task.

## Backend README

- Replace the NestJS starter README with project-specific documentation.
- Document Prisma as the current database layer.
- Include PostgreSQL setup, Prisma schema location, generated client location, and database URL behavior.
- Document environment variables from `.env.example` in grouped sections.
- Document common commands for install, dev, production, linting, tests, seeding, and Prisma CLI usage.
- Document Swagger endpoints at `/docs` and `/docs/json`.
- Mention that existing TypeORM scripts/dependencies are transitional or legacy unless intentionally retained by the team.

## Frontend README

- Replace the Next.js starter README with project-specific documentation.
- Document the Arabic RTL merchant dashboard, public storefront, and order tracking flows.
- Document Next.js 16, React 19, TypeScript, TailwindCSS 4, and Zod.
- Standardize setup commands around `pnpm`.
- Document `NEXT_PUBLIC_API_BASE_URL`.
- Add route, folder structure, and development workflow sections.

## Later Root README

- Add a root `README.md` later to explain the full repository, local startup order, app boundaries, and links to backend/frontend READMEs.
