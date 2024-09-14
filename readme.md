# Micro-frontends and the Wasm component model

## Overview

This repo demonstrates the integration of [WebAssembly components](https://component-model.bytecodealliance.org/design/why-component-model.html) written in JavaScript, componentized with [ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS) as micro-frontends and integrated into a UI using a slightly modified version of [Web-Fragments reframed library](https://github.com/web-fragments/web-fragments).

## Usage

This repo is a `pnpm` workspaces structure containing several components, ready to componentize and transpile.

### Install all dependencies

Install all dependencies by running

```bash

$ pnpm i

```
at root level

### Componentize the components

Components are found under ./packages/wasm-sources.

Run 

```bash
$ node componentize.mjs 
```
to generate the `wasm.component` files. They will be generated under each component folder, in a new generated directory called `output`.

### Transpile the component using JCO

Now you can run 

```bash
$ pnpm run transpile
```

To transpile the components. The output will be placed under the same `output` directory. 
For exammple, for `component2`, you should see the following output, both in the terminal and in the source code.

```bash
Transpiled JS Component Files:

 - ./output/component2/component2.component.core.wasm   6.44 MiB
 - ./output/component2/component2.component.core2.wasm  30.1 KiB
 - ./output/component2/component2.component.d.ts        0.59 KiB
 - ./output/component2/component2.component.js          44.5 KiB
 - ./output/component2/imports/environment.d.ts         0.09 KiB
 - ./output/component2/imports/exit.d.ts                0.16 KiB
 - ./output/component2/imports/filesystem.d.ts          3.85 KiB
 - ./output/component2/imports/monotonic-clock.d.ts     0.14 KiB
 - ./output/component2/imports/preopens.d.ts            0.47 KiB
 - ./output/component2/imports/random.d.ts               0.1 KiB
 - ./output/component2/imports/streams.d.ts             0.58 KiB
 - ./output/component2/imports/wall-clock.d.ts          0.18 KiB
 ```

 You can add new components to experiment. As long as you add them to the `wasm-sources` and call them `component{i}`, they will be included in the componentization and transpilation.

 ## Adding the components to the frontend app.

 This demo uses `web-fragments` to reframe the micro-frontends and add them to the UI. For example, to add component2, it is added as a new `.html` file, to the `public` folder at root level.

 This code is reponsible to reframing the component 
 
 
```javascript

// Reframe component module2
const endpoints = ['component2.html'];
const ref = `./${endpoints[0]}`;
const refId = ref.replace(/\.html$/, '');
const tageName = 'section';
const { container } = reframed(ref, { containerTagName: tageName });

container.setAttribute('style', 'border:3px dotted red');
container.setAttribute('id', `${tageName}-${refId}`);
// This should be part of the reframed: why wouldn't I be able to configure this?
const main = document.body.querySelector('main');
main.appendChild(container);
```
main.js

Make sure to have all dependencies in place. Read more about `web-fragments` following [this link](https://github.com/web-fragments/web-fragments)
 