#!/bin/bash

# Debug: Print the current directory
echo "Current directory: $(pwd)"

# Define the directories relative to the workspace
WASM_SOURCES_DIR="./packages/wasm-sources"
OUTPUT_DIR="output"

# Parse arguments
MAX_COMPONENTS="${1:-0}"

# Debug: Print the parsed arguments
echo "MAX_COMPONENTS: $MAX_COMPONENTS"

# Ensure MAX_COMPONENTS is a non-negative integer
if ! [[ "$MAX_COMPONENTS" =~ ^[0-9]+$ ]]; then
  echo "Error: MAX_COMPONENTS should be a non-negative integer."
  exit 1
fi

componentCount=2

# Check if the directory exists
if [ ! -d "$WASM_SOURCES_DIR" ]; then
  echo "WASM sources directory not found: $WASM_SOURCES_DIR"
  exit 1
fi

# Loop through all directories in the wasm sources folder that match component*
for componentDir in "$WASM_SOURCES_DIR"/component*; do
  # Stop processing if we've reached the max component count
  if [ "$MAX_COMPONENTS" -gt 0 ] && [ "$componentCount" -gt "$MAX_COMPONENTS" ]; then
    echo "Reached maximum component limit ($MAX_COMPONENTS). Stopping..."
    break
  fi

  # Check if the path is a directory
  if [ -d "$componentDir" ]; then
    # Extract component name (just the folder name, like wasm-component1)
    componentName=$(basename "$componentDir")
    echo "Processing component: $componentName"

    # Export the component name for use in the component's package.json
    export COMPONENT_NAME="$componentName"

    # Run the transpile command using pnpm for the current component
    echo "Running pnpm transpile for $componentName..."
    pnpm --filter "$WASM_SOURCES_DIR/$componentName" run transpile

    # Increment the component count
    componentCount=$((componentCount + 1))
  else
    echo "Skipping $componentDir, not a directory."
  fi
done
