$ErrorActionPreference = "SilentlyContinue"

(Get-Content src/app/App.tsx) -replace 'function DBInit\(\)', "/** Initializes the local and remote database records. */`nfunction DBInit()" | Set-Content src/app/App.tsx
git add src/app/App.tsx; git commit -m "docs: document DBInit hook inside App.tsx"; git push

(Get-Content src/app/components/layout.tsx) -replace 'export function Layout\(\)', "/** Primary screen layout wrapping all standard views. */`nexport function Layout()" | Set-Content src/app/components/layout.tsx
git add src/app/components/layout.tsx; git commit -m "docs: add JSDoc for Layout structural component"; git push

(Get-Content src/app/components/home-page.tsx) -replace 'export function HomePage\(\)', "/** Default route component rendering top promotions. */`nexport function HomePage()" | Set-Content src/app/components/home-page.tsx
git add src/app/components/home-page.tsx; git commit -m "docs: add top-level comment to HomePage"; git push

(Get-Content src/app/components/product-card.tsx) -replace 'export const ProductCard = memo', "/** Memoized list item for rendering individual products efficiently. */`nexport const ProductCard = memo" | Set-Content src/app/components/product-card.tsx
git add src/app/components/product-card.tsx; git commit -m "docs: document optimization logic in ProductCard component"; git push

(Get-Content src/app/components/orders-page.tsx) -replace 'const MINI_STEPS =', "/** Visual milestones representing order progression. */`nconst MINI_STEPS =" | Set-Content src/app/components/orders-page.tsx
git add src/app/components/orders-page.tsx; git commit -m "docs: clarify MINI_STEPS configuration in orders UI"; git push

(Get-Content src/app/components/cart-page.tsx) -replace 'export function CartPage\(\)', "/** Dedicated view for reviewing cart and preparing checkout. */`nexport function CartPage()" | Set-Content src/app/components/cart-page.tsx
git add src/app/components/cart-page.tsx; git commit -m "docs: define structure purpose in CartPage"; git push

(Get-Content src/app/components/login-page.tsx) -replace 'export function LoginPage\(\)', "/** Authentication entrypoint for existing users. */`nexport function LoginPage()" | Set-Content src/app/components/login-page.tsx
git add src/app/components/login-page.tsx; git commit -m "docs: specify user scope in LoginPage auth component"; git push

(Get-Content src/app/components/register-page.tsx) -replace 'export function RegisterPage\(\)', "/** Onboarding structure and validation for new user creation. */`nexport function RegisterPage()" | Set-Content src/app/components/register-page.tsx
git add src/app/components/register-page.tsx; git commit -m "docs: document onboarding behavior of RegisterPage"; git push

(Get-Content vite.config.ts) -replace 'export default defineConfig', "/** Vite config wrapper enforcing build rules */`nexport default defineConfig" | Set-Content vite.config.ts
git add vite.config.ts; git commit -m "chore: annotate vite config default export block"; git push

Add-Content -Path README.md -Value "`n## Performance`n`nCodebase implements React.memo for high-frequency render lists."
git add README.md; git commit -m "docs: add performance note to README"; git push
