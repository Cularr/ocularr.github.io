import { writeFileSync } from 'fs';
import { extractDefinitions } from './providers/definitions.mts';
import { hideIndexerUrls } from './providers/indexerUrls.mts';
import { buildSourceIndex } from './providers/sourceIndex.mts';

export default function extractProviders(sonarrDir: string, output: string) {
  const index = buildSourceIndex(sonarrDir);
  const definitions = hideIndexerUrls(extractDefinitions(index));

  const ambiguous = Array.from(new Set(index.duplicates)).filter((name) =>
    index.used.has(name)
  );

  if (ambiguous.length) {
    console.warn(
      `Duplicate C# type names, the first definition is used: ${ambiguous.join(
        ', '
      )}`
    );
  }

  writeFileSync(output, JSON.stringify(definitions));

  return definitions;
}
