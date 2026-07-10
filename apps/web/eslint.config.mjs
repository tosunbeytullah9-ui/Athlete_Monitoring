import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Hook bağımlılıkları — warning seviyesinde tut (Bug Partİ 3 kararı)
      "react-hooks/exhaustive-deps": "warn",
      // `(supabase as any)` kasıtlı escape-hatch (üretilen tiplerde olmayan
      // tablolar / derin tip instantiation). Düzgün tipleme ayrı bir iş →
      // şimdilik warn, error değil.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // shadcn/ui vendored bileşenleri — CLAUDE.md "dokunulma" diyor.
    // Kalıp gereği boş interface / iç değişkenler var; kuralları burada gevşet.
    files: ["components/ui/**"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
];

export default eslintConfig;
