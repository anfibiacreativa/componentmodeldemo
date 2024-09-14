var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_src = __commonJS({
  "src/index.ts"(exports, module) {
    const createHTMLDocument = () => document.implementation.createHTMLDocument("");
    let createDocument = (target, nextSibling) => {
      const testDoc = createHTMLDocument();
      testDoc.write("<script>");
      createDocument = testDoc.scripts.length ? createHTMLDocument : (target2, nextSibling2) => {
        const frame = document.createElement("iframe");
        frame.src = "";
        frame.style.display = "none";
        target2.insertBefore(frame, nextSibling2);
        const doc = frame.contentDocument;
        const { close } = doc;
        doc.close = () => {
          target2.removeChild(frame);
          close.call(doc);
        };
        return doc;
      };
      return createDocument(target, nextSibling);
    };
    function isBlocking(node) {
      return node.nodeType === Node.ELEMENT_NODE && (node.tagName === "SCRIPT" && node.src && !(node.noModule || node.type === "module" || node.hasAttribute("async") || node.hasAttribute("defer")) || node.tagName === "LINK" && node.rel === "stylesheet" && (!node.media || matchMedia(node.media).matches));
    }
    function getPreloadLink(node) {
      let link;
      if (node.nodeType === Node.ELEMENT_NODE) {
        switch (node.tagName) {
          case "SCRIPT":
            if (node.src && !node.noModule) {
              link = document.createElement("link");
              link.href = node.src;
              if (node.getAttribute("type") === "module") {
                link.rel = "modulepreload";
              } else {
                link.rel = "preload";
                link.as = "script";
              }
            }
            break;
          case "LINK":
            if (node.rel === "stylesheet" && (!node.media || matchMedia(node.media).matches)) {
              link = document.createElement("link");
              link.href = node.href;
              link.rel = "preload";
              link.as = "style";
            }
            break;
          case "IMG":
            link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            if (node.srcset) {
              link.imageSrcset = node.srcset;
              link.imageSizes = node.sizes;
            } else {
              link.href = node.src;
            }
            break;
        }
        if (link) {
          if (node.integrity) {
            link.integrity = node.integrity;
          }
          if (node.crossOrigin) {
            link.crossOrigin = node.crossOrigin;
          }
        }
      }
      return link;
    }
    function appendInlineTextIfNeeded(pendingText, inlineTextHostNode) {
      if (pendingText && inlineTextHostNode) {
        inlineTextHostNode.appendChild(pendingText);
      }
    }
    function isInlineHost(node) {
      const { tagName } = node;
      return tagName === "SCRIPT" && !node.src || tagName === "STYLE";
    }
    module.exports = function writableDOM(target, previousSibling) {
      if (this instanceof writableDOM) {
        return new WritableStream(writableDOM(target, previousSibling));
      }
      const nextSibling = previousSibling ? previousSibling.nextSibling : null;
      const doc = createDocument(target, nextSibling);
      doc.write("<!DOCTYPE html><body><template>");
      const root = doc.body.firstChild.content;
      const walker = doc.createTreeWalker(root);
      const targetNodes = new WeakMap([[root, target]]);
      let pendingText = null;
      let scanNode = null;
      let resolve;
      let isBlocked = false;
      let inlineHostNode = null;
      return {
        write(chunk) {
          doc.write(chunk);
          if (pendingText && !inlineHostNode) {
            targetNodes.get(pendingText).data = pendingText.data;
          }
          walk();
        },
        abort() {
          if (isBlocked) {
            targetNodes.get(walker.currentNode).remove();
          }
        },
        close() {
          const promise = isBlocked ? new Promise((_) => resolve = _) : Promise.resolve();
          return promise.then(() => {
            appendInlineTextIfNeeded(pendingText, inlineHostNode);
          });
        }
      };
      function walk() {
        let node;
        if (isBlocked) {
          const blockedNode = walker.currentNode;
          if (scanNode)
            walker.currentNode = scanNode;
          while (node = walker.nextNode()) {
            const link = getPreloadLink(scanNode = node);
            if (link) {
              link.onload = link.onerror = () => target.removeChild(link);
              target.insertBefore(link, nextSibling);
            }
          }
          walker.currentNode = blockedNode;
        } else {
          while (node = walker.nextNode()) {
            const clone = document.importNode(node, false);
            const previousPendingText = pendingText;
            if (node.nodeType === Node.TEXT_NODE) {
              pendingText = node;
            } else {
              pendingText = null;
              if (isBlocking(clone)) {
                isBlocked = true;
                clone.onload = clone.onerror = () => {
                  isBlocked = false;
                  if (clone.parentNode)
                    walk();
                };
              }
            }
            const parentNode = targetNodes.get(node.parentNode);
            targetNodes.set(node, clone);
            if (isInlineHost(parentNode)) {
              inlineHostNode = parentNode;
            } else {
              appendInlineTextIfNeeded(previousPendingText, inlineHostNode);
              inlineHostNode = null;
              if (parentNode === target) {
                target.insertBefore(clone, nextSibling);
              } else {
                parentNode.appendChild(clone);
              }
            }
            if (isBlocked)
              return walk();
          }
          if (resolve)
            resolve();
        }
      }
    };
  }
});
const WritableDOMStream = require_src();
function reframed(reframedSrcOrSourceShadowRoot, options = {
  containerTagName: "article"
}) {
  initializeParentExecutionContext();
  const iframe = document.createElement("iframe");
  iframe.hidden = true;
  const reframeMetadata = {
    iframeDocumentReadyState: "loading",
    iframe
  };
  const reframedContainer = "container" in options ? options.container : document.createElement(options.containerTagName);
  const reframedContainerShadowRoot = Object.assign(
    reframedContainer.shadowRoot ?? reframedContainer.attachShadow({ mode: "open" }),
    {
      [reframedMetadataSymbol]: reframeMetadata
    }
  );
  let { promise: monkeyPatchReady, resolve: resolveMonkeyPatchReady } = Promise.withResolvers();
  iframe.addEventListener("load", () => {
    monkeyPatchIFrameEnvironment(iframe, reframedContainerShadowRoot);
    resolveMonkeyPatchReady();
  });
  let reframeReady;
  if (typeof reframedSrcOrSourceShadowRoot === "string") {
    const reframedSrc = reframedSrcOrSourceShadowRoot;
    reframedContainer.setAttribute("reframed-src", reframedSrc);
    reframeReady = reframeWithFetch(
      reframedSrcOrSourceShadowRoot,
      reframedContainer.shadowRoot,
      iframe,
      options
    );
  } else {
    reframeReady = reframeFromTarget(reframedSrcOrSourceShadowRoot, iframe);
  }
  document.body.insertAdjacentElement("beforeend", iframe);
  const ready = Promise.all([monkeyPatchReady, reframeReady]).then(() => {
    reframedContainer.shadowRoot[reframedMetadataSymbol].iframeDocumentReadyState = "interactive";
    reframedContainer.shadowRoot.dispatchEvent(new Event("readystatechange"));
    setTimeout(() => {
      reframedContainer.shadowRoot[reframedMetadataSymbol].iframeDocumentReadyState = "complete";
      reframedContainer.shadowRoot.dispatchEvent(new Event("readystatechange"));
    }, 2e3);
  });
  return {
    iframe,
    container: reframedContainer,
    ready
  };
}
async function reframeWithFetch(reframedSrc, target, iframe, options) {
  console.debug("reframing (with fetch)!", {
    source: reframedSrc,
    targetContainer: target
  });
  const reframedHtmlResponse = await fetch(reframedSrc, {
    headers: options.headers
  });
  const reframedHtmlStream = reframedHtmlResponse.status === 200 ? reframedHtmlResponse.body : stringToStream(
    `error fetching ${reframedSrc} (HTTP Status = ${reframedHtmlResponse.status})<hr>${await reframedHtmlResponse.text()}`
  );
  const { promise, resolve } = Promise.withResolvers();
  iframe.src = reframedSrc;
  iframe.name = reframedSrc;
  iframe.id = reframedSrc.replace(/\.html$/, "").replace(/^\.\//, "");
  iframe.addEventListener("load", () => {
    reframedHtmlStream.pipeThrough(new TextDecoderStream()).pipeTo(new WritableDOMStream(target)).finally(() => {
      var _a;
      console.log("reframing done (reframeWithFetch)!", {
        source: reframedSrc,
        target,
        title: (_a = iframe.contentDocument) == null ? void 0 : _a.title
      });
      resolve();
    });
  });
  return promise;
}
async function reframeFromTarget(source, iframe) {
  console.debug("reframing! (reframeFromTarget)", { source });
  iframe.src = document.location.href;
  const scripts = [...source.querySelectorAll("script")];
  const { promise, resolve } = Promise.withResolvers();
  iframe.addEventListener("load", () => {
    scripts.forEach((script) => {
      const scriptType = script.getAttribute("data-script-type");
      script.removeAttribute("data-script-type");
      script.removeAttribute("type");
      if (scriptType) {
        script.setAttribute("type", scriptType);
      }
      assert(
        iframe.contentDocument !== null,
        "iframe.contentDocument is not defined"
      );
      getInternalReference(iframe.contentDocument, "body").appendChild(
        iframe.contentDocument.importNode(script, true)
      );
    });
    console.log("reframing done (reframeFromTarget)!", {
      source,
      title: document.defaultView.document.title
    });
    resolve();
  });
  return promise;
}
function monkeyPatchIFrameEnvironment(iframe, shadowRoot) {
  assert(
    iframe.contentWindow !== null && iframe.contentDocument !== null,
    "attempted to patch iframe before it was ready"
  );
  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;
  if ((iframeWindow == null ? void 0 : iframeWindow.location.origin) === "null" && (iframeWindow == null ? void 0 : iframeWindow.location.protocol) === "about:") {
    return;
  }
  const iframeDocumentPrototype = Object.getPrototypeOf(
    Object.getPrototypeOf(iframeDocument)
  );
  const mainDocument = shadowRoot.ownerDocument;
  const mainWindow = mainDocument.defaultView;
  let updatedIframeTitle = void 0;
  setInternalReference(iframeDocument, "body");
  Object.defineProperties(iframeDocumentPrototype, {
    title: {
      get: function() {
        var _a, _b;
        return updatedIframeTitle ?? // https://html.spec.whatwg.org/multipage/dom.html#document.title
        ((_b = (_a = shadowRoot.querySelector("title")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) ?? "[reframed document]";
      },
      set: function(newTitle) {
        updatedIframeTitle = newTitle;
      }
    },
    readyState: {
      get() {
        if (shadowRoot[reframedMetadataSymbol].iframeDocumentReadyState === "complete") {
          console.warn(
            "reframed warning: `document.readyState` possibly returned `'complete'` prematurely. If your app is not working correctly, please see https://github.com/web-fragments/web-fragments/issues/36  and comment on this issue so that we can prioritize fixing it."
          );
        }
        return shadowRoot[reframedMetadataSymbol].iframeDocumentReadyState;
      }
    },
    // redirect getElementById to be a scoped reframedContainer.querySelector query
    getElementById: {
      value(id) {
        return shadowRoot.querySelector(`[id="${id}"]`);
      }
    },
    // redirect getElementsByName to be a scoped reframedContainer.querySelector query
    getElementsByName: {
      value(name) {
        return shadowRoot.querySelector(`[name="${name}"]`);
      }
    },
    // redirect querySelector to be a scoped reframedContainer.querySelector query
    querySelector: {
      value(selector) {
        return shadowRoot.querySelector(selector);
      }
    },
    // redirect to mainDocument
    activeElement: {
      get: () => {
        return mainDocument.activeElement;
      }
    },
    // redirect to mainDocument
    head: {
      get: () => {
        return shadowRoot;
      }
    },
    body: {
      get: () => {
        return shadowRoot.firstElementChild;
      }
    },
    styleSheets: {
      get: () => {
        return shadowRoot.styleSheets;
      }
    },
    dispatchEvent: {
      value(event) {
        return shadowRoot.dispatchEvent(event);
      }
    },
    childElementCount: {
      get() {
        return shadowRoot.childElementCount;
      }
    },
    hasChildNodes: {
      value(id) {
        return shadowRoot.hasChildNodes();
      }
    },
    children: {
      get() {
        return shadowRoot.children;
      }
    },
    firstElementChild: {
      get() {
        return shadowRoot.firstElementChild;
      }
    },
    firstChild: {
      get() {
        return shadowRoot.firstChild;
      }
    },
    lastElementChild: {
      get() {
        return shadowRoot.lastElementChild;
      }
    },
    lastChild: {
      get() {
        return shadowRoot.lastChild;
      }
    },
    rootElement: {
      get() {
        return shadowRoot.firstChild;
      }
    }
  });
  Object.defineProperty(iframeDocumentPrototype, "unreframedBody", {
    get: () => {
      return getInternalReference(iframeDocument, "body");
    }
  });
  setInternalReference(iframeWindow, "history");
  class SyntheticPopStateEvent extends PopStateEvent {
  }
  const historyProxy = new Proxy(mainWindow.history, {
    get(target, property, receiver) {
      var _a;
      if (typeof ((_a = Object.getOwnPropertyDescriptor(History.prototype, property)) == null ? void 0 : _a.value) === "function") {
        return function(...args) {
          const result = Reflect.apply(
            History.prototype[property],
            this === receiver ? target : this,
            args
          );
          mainWindow.dispatchEvent(new SyntheticPopStateEvent("popstate"));
          return result;
        };
      }
      return Reflect.get(target, property, target);
    },
    set(target, property, receiver) {
      return Reflect.set(target, property, receiver);
    }
  });
  Object.defineProperties(iframeWindow, {
    history: {
      get() {
        return historyProxy;
      }
    }
  });
  iframeWindow.IntersectionObserver = mainWindow.IntersectionObserver;
  const windowSizeProperties = ["innerHeight", "innerWidth", "outerHeight", "outerWidth"];
  for (const windowSizeProperty of windowSizeProperties) {
    Object.defineProperty(iframeWindow, windowSizeProperty, {
      get: function reframedWindowSizeGetter() {
        return mainWindow[windowSizeProperty];
      }
    });
  }
  const domCreateProperties = [
    "createAttributeNS",
    "createCDATASection",
    "createComment",
    "createDocumentFragment",
    "createEvent",
    "createExpression",
    "createNSResolver",
    "createNodeIterator",
    "createProcessingInstruction",
    "createRange",
    "createTextNode",
    "createTreeWalker"
  ];
  for (const createProperty of domCreateProperties) {
    Object.defineProperty(iframeDocumentPrototype, createProperty, {
      value: function reframedCreateFn() {
        return mainDocument[createProperty].apply(mainDocument, arguments);
      }
    });
  }
  Object.defineProperties(iframeDocument, {
    createElement: {
      value: function createElement(...[tagName]) {
        return Document.prototype.createElement.apply(
          tagName.includes("-") ? iframeDocument : mainDocument,
          arguments
        );
      }
    },
    createElementNS: {
      value: function createElementNS(...[namespaceURI, tagName]) {
        return Document.prototype.createElementNS.apply(
          namespaceURI === "http://www.w3.org/1999/xhtml" && tagName.includes("-") ? iframeDocument : mainDocument,
          arguments
        );
      }
    }
  });
  const domQueryProperties = [
    "querySelector",
    "querySelectorAll",
    "getElementsByClassName",
    "getElementsByTagName",
    "getElementsByTagNameNS"
  ];
  for (const queryProperty of domQueryProperties) {
    Object.defineProperty(iframeDocumentPrototype, queryProperty, {
      value: function reframedCreateFn() {
        return shadowRoot[queryProperty].apply(shadowRoot, arguments);
      }
    });
  }
  const controller = new AbortController();
  const nonRedirectedEvents = ["DOMContentLoaded", "popstate", "unload"];
  iframeWindow.EventTarget.prototype.addEventListener = new Proxy(
    iframeWindow.EventTarget.prototype.addEventListener,
    {
      apply(target, thisArg, argumentsList) {
        const [eventName, listener, optionsOrCapture] = argumentsList;
        const options = typeof optionsOrCapture === "boolean" ? { capture: optionsOrCapture } : typeof optionsOrCapture === "object" ? optionsOrCapture : {};
        const signal = AbortSignal.any(
          [controller.signal, options.signal].filter((signal2) => signal2 != null)
        );
        const modifiedArgumentsList = [
          eventName,
          listener,
          { ...options, signal }
        ];
        if (!nonRedirectedEvents.includes(eventName)) {
          if (thisArg === iframeWindow) {
            thisArg = mainWindow;
          } else if (thisArg === iframeDocument) {
            thisArg = shadowRoot;
          }
        }
        return Reflect.apply(target, thisArg, modifiedArgumentsList);
      }
    }
  );
  iframeWindow.EventTarget.prototype.removeEventListener = new Proxy(
    iframeWindow.EventTarget.prototype.removeEventListener,
    {
      apply(target, thisArg, argumentsList) {
        const [eventName] = argumentsList;
        if (!nonRedirectedEvents.includes(eventName)) {
          if (thisArg === iframeWindow) {
            thisArg = mainWindow;
          } else if (thisArg === iframeDocument) {
            thisArg = shadowRoot;
          }
        }
        return Reflect.apply(target, thisArg, argumentsList);
      }
    }
  );
  const handleNavigate = (e) => {
    getInternalReference(iframeWindow, "history").replaceState(
      window.history.state,
      "",
      window.location.href
    );
    if (e instanceof SyntheticPopStateEvent) {
      return;
    }
    iframeWindow.dispatchEvent(
      new PopStateEvent("popstate", e instanceof PopStateEvent ? e : void 0)
    );
  };
  window.addEventListener("reframed:navigate", handleNavigate, {
    signal: controller.signal
  });
  window.addEventListener("popstate", handleNavigate, {
    signal: controller.signal
  });
  iframeWindow.addEventListener("unload", () => controller.abort());
}
function monkeyPatchHistoryAPI() {
  const historyMethods = [
    "pushState",
    "replaceState",
    "back",
    "forward",
    "go"
  ];
  historyMethods.forEach((historyMethod) => {
    const originalFn = window.history[historyMethod];
    Object.defineProperty(window.history, historyMethod, {
      // TODO: come up with a better workaround that a no-op setter that doesn't break Qwik.
      // QwikCity tries to monkey-patch `pushState` and `replaceState` which results in a runtime error:
      //   TypeError: Cannot set property pushState of #<History> which only has a getter
      // https://github.com/QwikDev/qwik/blob/3c5e5a7614c3f64cbf89f1304dd59609053eddf0/packages/qwik-city/runtime/src/spa-init.ts#L127-L135
      set: () => {
      },
      get: () => {
        return function reframedHistoryGetter() {
          Reflect.apply(originalFn, window.history, arguments);
          window.dispatchEvent(new CustomEvent("reframed:navigate"));
        };
      },
      configurable: true
    });
  });
}
function monkeyPatchDOMInsertionMethods() {
  const _Element__replaceWith = Element.prototype.replaceWith;
  function executeScriptInReframedContext(script, reframedContext) {
    const validScriptTypes = [
      "module",
      "text/javascript",
      "importmap",
      "speculationrules",
      "",
      null
    ];
    if (!validScriptTypes.includes(script.getAttribute("type"))) {
      return script;
    }
    const iframe = reframedContext.iframe;
    assert(
      iframe.contentDocument !== null,
      "iframe.contentDocument is not defined"
    );
    if (!script.textContent) {
      const clone = document.importNode(script, true);
      getInternalReference(iframe.contentDocument, "body").appendChild(script);
      return clone;
    }
    const scriptToExecute = iframe.contentDocument.importNode(script, true);
    getInternalReference(iframe.contentDocument, "body").appendChild(
      scriptToExecute
    );
    const alreadyStartedScript = document.importNode(scriptToExecute, true);
    _Element__replaceWith.call(script, alreadyStartedScript);
    return alreadyStartedScript;
  }
  function executeAnyChildScripts(element, reframedContext) {
    var _a;
    const scripts = ((_a = element.querySelectorAll) == null ? void 0 : _a.call(element, "script")) ?? [];
    scripts.forEach(
      (script) => executeScriptInReframedContext(script, reframedContext)
    );
  }
  function isWithinReframedDOM(node) {
    const root = node.getRootNode();
    return isReframedShadowRoot(root);
  }
  function getReframedMetadata(node) {
    const root = node.getRootNode();
    if (!isReframedShadowRoot(root)) {
      throw new Error("Missing reframed metadata!");
    }
    return root[reframedMetadataSymbol];
  }
  const _Node__appendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function appendChild(node) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      executeAnyChildScripts(node, reframedContext);
      if (node instanceof HTMLScriptElement) {
        node = arguments[0] = executeScriptInReframedContext(
          node,
          reframedContext
        );
      }
    }
    return _Node__appendChild.apply(this, arguments);
  };
  const _Node__insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore(node, child) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      executeAnyChildScripts(node, reframedContext);
      if (node instanceof HTMLScriptElement) {
        node = arguments[0] = executeScriptInReframedContext(
          node,
          reframedContext
        );
      }
    }
    return _Node__insertBefore.apply(this, arguments);
  };
  const _Node__replaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function replaceChild(node, child) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      executeAnyChildScripts(node, reframedContext);
      if (node instanceof HTMLScriptElement && isWithinReframedDOM(node)) {
        node = arguments[0] = executeScriptInReframedContext(
          node,
          reframedContext
        );
      }
    }
    return _Node__replaceChild.apply(this, arguments);
  };
  const _Element__after = Element.prototype.after;
  Element.prototype.after = function after(...nodes) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      nodes.forEach((node, index) => {
        if (typeof node !== "string") {
          executeAnyChildScripts(node, reframedContext);
          if (node instanceof HTMLScriptElement) {
            node = arguments[index] = executeScriptInReframedContext(
              node,
              reframedContext
            );
          }
        }
      });
    }
    return _Element__after.apply(this, arguments);
  };
  const _Element__append = Element.prototype.append;
  Element.prototype.append = function append(...nodes) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      nodes.forEach((node, index) => {
        if (typeof node !== "string") {
          executeAnyChildScripts(node, reframedContext);
          if (node instanceof HTMLScriptElement) {
            node = arguments[index] = executeScriptInReframedContext(
              node,
              reframedContext
            );
          }
        }
      });
    }
    return _Element__append.apply(this, arguments);
  };
  const _Element__insertAdjacentElement = Element.prototype.insertAdjacentElement;
  Element.prototype.insertAdjacentElement = function insertAdjacentElement(where, element) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      executeAnyChildScripts(element, reframedContext);
      if (element instanceof HTMLScriptElement) {
        element = arguments[1] = executeScriptInReframedContext(
          element,
          reframedContext
        );
      }
    }
    return _Element__insertAdjacentElement.apply(this, arguments);
  };
  const _Element__prepend = Element.prototype.prepend;
  Element.prototype.prepend = function prepend(...nodes) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      nodes.forEach((node, index) => {
        if (typeof node !== "string") {
          executeAnyChildScripts(node, reframedContext);
          if (node instanceof HTMLScriptElement) {
            node = arguments[index] = executeScriptInReframedContext(
              node,
              reframedContext
            );
          }
        }
      });
    }
    return _Element__prepend.apply(this, arguments);
  };
  const _Element__replaceChildren = Element.prototype.replaceChildren;
  Element.prototype.replaceChildren = function replaceChildren(...nodes) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      nodes.forEach((node, index) => {
        if (typeof node !== "string") {
          executeAnyChildScripts(node, reframedContext);
          if (node instanceof HTMLScriptElement) {
            node = arguments[index] = executeScriptInReframedContext(
              node,
              reframedContext
            );
          }
        }
      });
    }
    return _Element__replaceChildren.apply(this, arguments);
  };
  Element.prototype.replaceWith = function replaceWith(...nodes) {
    if (isWithinReframedDOM(this)) {
      const reframedContext = getReframedMetadata(this);
      nodes.forEach((node, index) => {
        if (typeof node !== "string") {
          executeAnyChildScripts(node, reframedContext);
          if (node instanceof HTMLScriptElement) {
            node = arguments[index] = executeScriptInReframedContext(
              node,
              reframedContext
            );
          }
        }
      });
    }
    return _Element__replaceWith.apply(this, arguments);
  };
}
function initializeParentExecutionContext() {
  if (!(reframedInitializedSymbol in window)) {
    Object.assign(window, { [reframedInitializedSymbol]: true });
    monkeyPatchDOMInsertionMethods();
    monkeyPatchHistoryAPI();
  }
}
const stringToStream = (str) => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(str));
      controller.close();
    }
  });
};
function assert(value, message) {
  console.assert(value, message);
}
const reframedInitializedSymbol = Symbol("reframed:initialized");
const reframedMetadataSymbol = Symbol("reframed:metadata");
const reframedReferencesSymbol = Symbol("reframed:references");
function isReframedShadowRoot(node) {
  return node instanceof ShadowRoot && node[reframedMetadataSymbol] !== void 0;
}
function setInternalReference(target, key) {
  target[reframedReferencesSymbol] ?? (target[reframedReferencesSymbol] = {});
  target[reframedReferencesSymbol][key] = Reflect.get(target, key);
}
function getInternalReference(target, key) {
  const references = target[reframedReferencesSymbol];
  if (!references || references[key] === void 0) {
    throw new Error(
      `Attempted to access internal reference "${String(key)}" before it was set.`
    );
  }
  return references[key];
}
export {
  reframed
};
