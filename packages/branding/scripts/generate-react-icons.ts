import { transform } from "@svgr/core";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const svgFiles = [
  {
    input: "src/assets/icon.svg",
    output: "src/react/BonderyIcon.tsx",
    componentName: "BonderyIcon",
  },
  {
    input: "src/assets/icon-white.svg",
    output: "src/react/BonderyIconWhite.tsx",
    componentName: "BonderyIconWhite",
  },
  {
    input: "src/assets/logotype-black.svg",
    output: "src/react/BonderyLogotypeBlack.tsx",
    componentName: "BonderyLogotypeBlack",
  },
  {
    input: "src/assets/logotype-white.svg",
    output: "src/react/BonderyLogotypeWhite.tsx",
    componentName: "BonderyLogotypeWhite",
  },
];

// Custom template that injects a unique ID to prevent collisions when multiple instances are rendered
const template = (variables: any, { tpl }: any) => {
  return tpl`
${variables.imports};

${variables.interfaces};

const ${variables.componentName} = (${variables.props}) => {
  const uniqueId = React.useId().replace(/:/g, "");

  return (
    ${variables.jsx}
  );
};
 
${variables.exports};
`;
};

async function generateReactIcons() {
  console.log("🎨 Generating React icons from SVG...");

  for (const file of svgFiles) {
    const inputPath = join(__dirname, "..", file.input);
    const outputPath = join(__dirname, "..", file.output);

    try {
      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const svgCode = readFileSync(inputPath, "utf-8");

      // Check if SVG uses IDs (for gradients, masks, etc.)
      const hasIds = svgCode.includes('id="');

      const options: any = {
        typescript: true,
        plugins: ["@svgr/plugin-jsx", "@svgr/plugin-prettier"],
        icon: false,
        exportType: "named",
        namedExport: file.componentName,
        memo: false,
      };

      // Only use custom template if IDs need to be scoped
      if (hasIds) {
        options.template = template;
      }

      let jsCode = await transform(svgCode, options, {
        componentName: file.componentName,
      });

      if (hasIds) {
        // Replace static IDs with dynamic ones using the injected uniqueId
        // 1. Replace id definitions: id="value" -> id={`value-${uniqueId}`}
        jsCode = jsCode.replace(/id="([^"]+)"/g, "id={`$1-${uniqueId}`}");

        // 2. Replace url references: ="url(#value)" -> ={`url(#value-${uniqueId})`}
        jsCode = jsCode.replace(/="url\(#([^)]+)\)"/g, "={`url(#$1-${uniqueId})`}");
      }

      writeFileSync(outputPath, jsCode);
      console.log(`✅ Generated ${file.output}`);
    } catch (error) {
      console.error(`❌ Error generating ${file.output}:`, error);
      process.exit(1);
    }
  }

  console.log("✨ All React icons generated successfully!");
}

generateReactIcons();
