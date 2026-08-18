This repository prefers pnpm as the package manager.

Recommended local setup steps (safe):

1. Use Node 16.14+ (or your project's `engines.node`).
2. Enable Corepack (bundled with Node >=16.9):

   ```sh
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

3. Or install pnpm globally if Corepack is unavailable:

   ```sh
   npm i -g pnpm
   ```

4. Install dependencies at the repo root:

   ```sh
   pnpm install
   ```

If you want the repository to auto-enable pnpm where Corepack exists, run the root script:

```sh
pnpm run setup-pnpm
```
