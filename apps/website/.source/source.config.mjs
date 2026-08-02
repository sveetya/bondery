// source.config.ts
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import remarkGfm from "remark-gfm";
import { z } from "zod";
var repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
function isGitLastModifiedAvailable() {
  try {
    execSync("git --version", { stdio: "ignore" });
    execSync("git rev-parse --show-toplevel", { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
var docs = defineDocs({
  dir: "../../docs",
  docs: {
    files: ["**/*.mdx"],
    postprocess: {
      includeProcessedMarkdown: true
    },
    schema: pageSchema.extend({
      description: z.string().optional(),
      docId: z.string().optional(),
      docPath: z.string().optional(),
      docSections: z.record(z.string(), z.string()).optional(),
      hidden: z.boolean().optional(),
      icon: z.string().optional()
    })
  },
  meta: {
    schema: metaSchema
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    providerImportSource: "@/components/mdx",
    remarkPlugins: [remarkGfm]
  },
  plugins: [
    lastModified({
      versionControl: isGitLastModifiedAvailable() ? "git" : async () => void 0
    })
  ]
});
export {
  source_config_default as default,
  docs
};
