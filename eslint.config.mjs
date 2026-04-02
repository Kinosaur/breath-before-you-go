import { defineConfig } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default defineConfig([
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            "out/**",
            "dist/**",
            "build/**",
            "next-env.d.ts",
        ],
    },
    ...compat.config({
        extends: ["next/core-web-vitals", "next/typescript"],
    }),
]);