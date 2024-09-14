import { componentize } from '@bytecodealliance/componentize-js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const wasmSourcesDir = './packages/wasm-sources';
const outputBaseDir = './packages/wasm-sources/'; // Base output directory

await mkdir(outputBaseDir, { recursive: true });

const components = await readdir(wasmSourcesDir);

let componentIndex = 1; // Initialize component counter

for (const componentDir of components) {
  const dirPath = join(wasmSourcesDir, componentDir);

  try {
    // Check if the path is a directory
    const fileStat = await stat(dirPath);
    if (fileStat.isDirectory()) {
      const files = await readdir(dirPath);

      const jsFile = files.find(file => file.endsWith('.js'));
      const witFile = files.find(file => file.endsWith('.wit'));

      if (jsFile && witFile) {
        const jsSourcePath = join(dirPath, jsFile);
        const witSourcePath = join(dirPath, witFile);

        const jsSource = await readFile(jsSourcePath, 'utf8');
        console.log(jsSource, `#jssource-${componentDir}`);

        const witSource = await readFile(witSourcePath, 'utf8');
        console.log(witSource, `#witsource-${componentDir}`);

        const { component } = await componentize(jsSource, witSource);
        console.log(typeof(component), component, `#######component-${componentDir}`);

        // Create the specific output directory for the current component (component{i})
        const componentOutputDir = join(outputBaseDir, `component${componentIndex}`, `output`);
        await mkdir(componentOutputDir, { recursive: true });

        // Output file path for the wasm component
        const wasmOutputPath = join(componentOutputDir, `${componentDir}.component.wasm`);
        await writeFile(wasmOutputPath, component);
        console.log(`WASM file written to ${wasmOutputPath}`);

        componentIndex++; // Increment the component counter
      } else {
        console.log(`No .js or .wit files found in ${componentDir}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${componentDir}:`, error);
  }
}
