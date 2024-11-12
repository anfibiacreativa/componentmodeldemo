import { reframed } from './packages/reframed/dist/reframed.js';
import { SOURCES } from './packages/wasm-sources/wasm-sources.js'

// Load the WASM components
let imgSrc = '';
const sources = SOURCES;

async function loadAndRunWasmComponent() {
    // Get the input from the HTML input field
    const inputGreeting = document.getElementById('greeting').value;

    // Dynamically import the WebAssembly component (componentized)
    try {
        // Import the WASM component for day/night detection
        const module1 = await import(sources.module1);
        const module2 = await import(sources.module2);
        // Call the `daynightdetection` function from the WASM module
        const result = module1.daynightdetection(inputGreeting);
        imgSrc = module2.getsunormoon(result);
        postMessageToIframe(result, imgSrc);
        // Display the result in the HTML
        document.getElementById('result').textContent = result;
    } catch (err) {
        console.error('Error loading or running WASM component:', err);
    }
}

function postMessageToIframe(result, imgSrc) {
  const iframe = document.querySelector('iframe#component2'); 
  if (iframe) {
      // Ensure the iframe is loaded before sending the message
      console.log('message being sent');
      iframe.contentWindow.postMessage({
        type: 'updateImage',
        data: {
            result: result,
            imgSrc: imgSrc
        }
    }, '*');
  } else {
      console.error('Iframe not found!');
  }
}

// Attach the `loadAndRunWasmComponent` function to the button click
document.getElementById('detectButton').addEventListener('click', loadAndRunWasmComponent);

// Reframe component module2
const endpoints = ['component2.html'];
const ref = `./${endpoints[0]}`;
const refId = ref.replace(/\.html$/, '');
const tageName = 'section';
const { container } = reframed(ref, { containerTagName: tageName });

container.setAttribute('style', 'border:3px dotted red; align-items: center;');
container.setAttribute('id', `${tageName}-${refId}`);
// This should be part of the reframed: why wouldn't I be able to configure this?
const main = document.body.querySelector('main');
main.appendChild(container);

