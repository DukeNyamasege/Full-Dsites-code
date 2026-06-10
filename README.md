# Reef Sites Workspace

This workspace now has a lightweight monorepo foundation for the two existing applications:

- `deriv-sites-ui-kit-main` - Reef Sites admin/control-panel app
- `repo-push-new-user-interface` - client-facing trading website template

## Current status

The apps have **not** been physically moved yet. That is intentional for safety in this first phase.

Why:

- both apps already have their own working tooling assumptions
- the trading app includes its own repo/tooling structure
- moving folders now would create avoidable risk before shared packages and runtime config are introduced

## Planned target structure

The intended target architecture is:

```text
workspace/
  apps/
    admin/
    trading-web/
  packages/
    shared-types/
    site-config-schema/
    deriv-auth/
  supabase/
    migrations/
    functions/
```

## Safe first move completed

This workspace now provides:

- a root npm workspace configuration
- placeholder shared package folders
- an initial `site-config-schema` package for future shared runtime config typing

## Current app mapping

Planned mapping for a later refactor:

- `deriv-sites-ui-kit-main` -> `apps/admin`
- `repo-push-new-user-interface` -> `apps/trading-web`

## Running the apps today

From the workspace root:

```bash
npm run dev:admin
npm run dev:trading-web
```

Or run them directly in their current folders:

```bash
cd deriv-sites-ui-kit-main
npm run dev
```

```bash
cd repo-push-new-user-interface
npm run start
```

## Notes

- The trading app still uses its existing hardcoded domain configuration.
- No trading logic, OAuth logic, or Supabase schema was changed in this phase.
- The shared packages are placeholders only and are not connected to either app yet.
