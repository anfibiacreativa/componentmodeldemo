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
export default require_src();
