# Reef Sites Public Config API Plan

## Status

This document now reflects the backend foundation that has been added for public runtime site config.

Important:

- the trading app still defaults to local `DOMAIN_CONFIG`
- remote config is still disabled by default in the trading app
- admin/private APIs remain separate from the public runtime config API

## API architecture decision

We are using one Supabase project/database with two logical API surfaces:

1. Private admin/config surface
   - authenticated
   - used by Reef Sites dashboards and setup flows
   - may access private site ownership and token-related records

2. Public runtime config surface
   - read-only
   - frontend-safe
   - returns only public branding, feature flags, page metadata, public Deriv app settings, and bot manifest metadata

This separation is intentional. The public runtime config API must never expose:

- `deriv_api_token`
- user session tokens
- access tokens
- refresh tokens
- payment data
- profile emails
- admin-only data

## Public endpoint

Implemented Edge Function:

- `/functions/v1/public-site-config?hostname=example.com`

Function path:

- `supabase/functions/public-site-config/index.ts`

Current behavior:

- normalizes hostname
- requires `hostname`
- resolves only verified/active records from `site_domains`
- requires the linked `sites` row to be `active`
- prefers the latest published `site_publish_versions.config_snapshot_json`
- falls back to normalized public config tables when no published snapshot exists
- returns a frontend-safe runtime config payload
- returns `404` when no active verified domain is found

## Tables added for runtime config

The following normalized tables were added:

- `site_domains`
- `site_settings`
- `site_features`
- `site_pages`
- `site_deriv_apps`
- `site_bots_manifest`
- `site_publish_versions`

## Existing tables that still exist

Existing Reef Sites tables remain in place:

- `sites`
- `domain_purchases`
- `xml_bots`
- `user_subscriptions`
- `profiles`
- `commissions`

### What gets reused

- `sites`
  - still acts as the root site entity
- `domain_purchases`
  - still tracks commercial domain purchase flow
- `xml_bots`
  - still acts as the existing upload source

### What should not be reused directly for public config responses

- `sites.deriv_api_token`
- `domain_purchases` payment fields
- `profiles`
- `user_subscriptions`
- `commissions`

These stay private/admin-side.

## Public response shape

The public function returns the same core shape expected by the trading app runtime config layer:

```ts
type RuntimeSiteConfig = {
  site: {
    id: string;
    name: string;
    hostname: string;
  };
  branding: {
    brandName: string;
    logoUrl?: string;
    faviconUrl?: string;
    theme: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      headerBgColor?: string;
      headerTextColor?: string;
    };
    customCssVars?: Record<string, string>;
  };
  deriv: {
    oauthClientId?: string;
    appId?: string;
    redirectUri?: string;
    useLegacyOAuthLogin?: boolean;
    includeLegacyAppIdInOAuth?: boolean;
  };
  features: {
    botIdeas?: boolean;
    printPopups?: boolean;
    autoTrades?: boolean;
    manualTrading?: boolean;
    scanner?: boolean;
    chart?: boolean;
    bestBots?: boolean;
    copyTrading?: boolean;
    percentageTool?: boolean;
  };
  pages: Array<{
    key: string;
    label?: string;
    enabled: boolean;
    order: number;
  }>;
  bots: Array<{
    id?: string;
    name: string;
    filePath?: string;
    displayOrder?: number;
    isActive?: boolean;
  }>;
};
```

The current Edge Function also includes a small `meta` object for debugging/publish visibility. It contains no secrets.

## Security model

### Database

The normalized config tables use RLS and default to no anonymous direct access.

Authenticated access is limited to:

- site owners via `sites.user_id`
- admins via `public.has_role(auth.uid(), 'admin')`

### Public function

The public Edge Function is the only intended anonymous read path.

It uses the service role internally, but only returns a strict, manually selected response. It does not select or forward:

- `sites.deriv_api_token`
- payment rows
- profiles
- subscription rows
- admin-only records

## Current fallback behavior

Frontend behavior remains:

1. Remote config, if explicitly enabled in trading app env
2. Local `DOMAIN_CONFIG` adapter
3. Safe selector defaults

The trading app is not switched yet.

## Publish-state note

The public function now prefers the latest `published` snapshot for a site.

Fallback remains intentionally safe:

1. latest published snapshot
2. live normalized rows

This allows staged publishing without breaking local/staging verification when a snapshot has not yet been created.

## Local verification

Apply migrations, then serve the function locally.

Example:

```bash
supabase db reset
supabase functions serve public-site-config --no-verify-jwt
curl "http://127.0.0.1:54321/functions/v1/public-site-config?hostname=example.com"
```

## Seed / dev data

A safe example file was added:

- `docs/PUBLIC_CONFIG_SEED_EXAMPLE.sql`

Use it only for local or staging verification, and never insert:

- private Deriv API tokens
- user session secrets
- payment secrets

## Trading app envs for later staged testing

Later, for local or staging only:

```env
VITE_ENABLE_REMOTE_SITE_CONFIG=true
VITE_SITE_CONFIG_API_BASE_URL=https://<your-supabase-project>.supabase.co/functions/v1
```

Do not enable this in production until remote output is validated against existing local `DOMAIN_CONFIG`.

## Next-step rollout

1. Apply the new migrations locally
2. Seed one staging-safe site config
3. Call `public-site-config` locally and inspect the payload
4. Compare the payload against the trading app runtime expectations
5. Enable remote config only in local/staging
6. Test one staging hostname
7. Only then consider production rollout
