import { createJiti } from "jiti";

const jiti = createJiti(process.cwd());
// Load and run test files
await jiti.import("./src/features/home/utils/__tests__/mapInteraction.test.ts");
await jiti.import("./src/features/home/utils/__tests__/statisticsCalculator.test.ts");
await jiti.import("./src/server/functions/__tests__/newsletter.test.ts");
console.log(
  "All map interaction, statistics, and newsletter tests loaded and executed successfully!",
);
