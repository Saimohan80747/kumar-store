$ErrorActionPreference = "Stop"

(Get-Content src/main.tsx) -replace "throw new Error", "// Ensures root element exists before rendering`n  throw new Error" | Set-Content src/main.tsx
git add src/main.tsx; git commit -m "docs: add safety documentation in main.tsx"; git push

(Get-Content src/app/utils/security.ts) -replace "export const sanitizeInput", "/** Sanitizes user input to prevent XSS. */`nexport const sanitizeInput" | Set-Content src/app/utils/security.ts
git add src/app/utils/security.ts; git commit -m "docs: add JSDoc for sanitizeInput in security.ts"; git push

(Get-Content src/app/services/supabase.ts) -replace "export const supabase =", "/** Initialize central Supabase client instance */`nexport const supabase =" | Set-Content src/app/services/supabase.ts
git add src/app/services/supabase.ts; git commit -m "docs: add client initialization comment to supabase.ts"; git push

(Get-Content src/app/store.ts) -replace "export interface User", "/** System user representation */`nexport interface User" | Set-Content src/app/store.ts
git add src/app/store.ts; git commit -m "docs: document User interface in store.ts"; git push

(Get-Content src/app/api.ts) -replace "export const fetch", "/** Fetches external api data safely */`nexport const fetch" | Set-Content src/app/api.ts
git add src/app/api.ts; git commit -m "docs: add JSDoc for fetch function in api.ts"; git push

(Get-Content src/app/components/footer.tsx) -replace "<footer", "<footer role=`"contentinfo`"" | Set-Content src/app/components/footer.tsx
git add src/app/components/footer.tsx; git commit -m "feat: enhance footer accessibility with role attribute"; git push

(Get-Content src/app/components/navbar.tsx) -replace "<nav", "<nav role=`"navigation`"" | Set-Content src/app/components/navbar.tsx
git add src/app/components/navbar.tsx; git commit -m "feat: enhance navbar accessibility with role attribute"; git push

(Get-Content src/app/components/bottom-nav.tsx) -replace "<nav", "<nav aria-label=`"Bottom Navigation`"" | Set-Content src/app/components/bottom-nav.tsx
git add src/app/components/bottom-nav.tsx; git commit -m "feat: improve bottom-nav accessibility with aria-label"; git push

Add-Content -Path README.md -Value "`n## Accessibility`n`nFocus has been enhanced for navigation landmarks."
git add README.md; git commit -m "docs: add accessibility section to README"; git push
