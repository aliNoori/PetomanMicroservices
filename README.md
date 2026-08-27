# Petoman Microservices

A modular microservices architecture for the Petoman platform.

## Architecture

The project is organized as a monorepo and currently includes:

* **Gateway** — API Gateway, routing, authentication, request handling, error handling, and API response normalization.
* **Auth Service** — Authentication, users, tenants, memberships, roles, permissions, and tenant authorization.
* **Market Service** — E-commerce and marketplace domain.
* **Vet Service** — Veterinary domain.
* **Pharmacy Service** — Pharmacy domain.
* **Financial Service** — Financial domain.
* **Security Package** — Shared authentication, authorization, JWT, roles, permissions, and tenant-context functionality.

## Project Structure

```text
PetomanMicroservices/
├── gateway/
├── packages/
│   └── security/
├── services/
│   ├── auth/
│   ├── financial/
│   ├── market/
│   ├── pharmacy/
│   └── vet/
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## Current Authentication & Tenant Flow

The authentication and tenant-management flow currently supports:

1. User registration and login.
2. Tenant creation.
3. User tenant-membership requests.
4. Tenant administrators reviewing membership requests.
5. Membership approval or rejection.
6. Tenant selection by the authenticated user.
7. Tenant-aware authorization.
8. Role and permission management.
9. JWT-based authentication across services.
10. Gateway-level request authentication and routing.

## Technologies

* NestJS
* TypeScript
* Node.js
* pnpm Workspaces
* PostgreSQL
* TypeORM
* JWT
* Laravel
* Go

## Repository

The project is maintained as a monorepo containing the API Gateway, shared packages, and domain microservices.

## Status

🚧 Active development

The core authentication, authorization, tenant, membership, and API Gateway foundations are currently implemented. Additional business-domain modules will be developed incrementally.