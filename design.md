src/
  app/
    (public)/
      page.tsx
      about/page.tsx
      ministries/page.tsx
      contact/page.tsx

    (auth)/
      login/page.tsx
      signup/page.tsx
      verify-email/page.tsx
      pending-approval/page.tsx
      forgot-password/page.tsx

    (dashboard)/
      dashboard/
        page.tsx
        profile/page.tsx

        archdiocese/
          page.tsx
          users/page.tsx
          registrations/page.tsx
          vicariates/page.tsx
          reports/page.tsx

        vicariate/
          page.tsx
          deaneries/page.tsx
          parishes/page.tsx
          reports/page.tsx

        deanery/
          page.tsx
          parishes/page.tsx
          reports/page.tsx

        parish/
          page.tsx
          reports/page.tsx
          data-entry/page.tsx

    api/
      auth/
      admin/
      registrations/
      users/
      reports/

  components/
    auth/
    dashboard/
    forms/
    tables/
    layout/
    ui/

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    auth/
      getCurrentUser.ts
      requireAuth.ts
      requireApprovedUser.ts
      requireRole.ts
      requireScope.ts
    permissions/
      roles.ts
      scopes.ts
      access.ts
    db/
      queries/
      mutations/

  features/
    auth/
    users/
    hierarchy/
    registrations/
    reports/

  types/
    auth.ts
    db.ts
    hierarchy.ts
    roles.ts