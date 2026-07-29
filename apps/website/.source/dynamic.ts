// @ts-nocheck
import { dynamic } from "fumadocs-mdx/runtime/dynamic";
import * as Config from "../source.config";

const _create = await dynamic<
  typeof Config,
  import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
    DocData: {
      docs: {
        /**
         * Last modified date of document file, obtained from version control.
         */
        lastModified?: Date;
      };
    };
  }
>(Config, { configPath: "source.config.ts", environment: "dynamic", outDir: ".source", root: "" });
