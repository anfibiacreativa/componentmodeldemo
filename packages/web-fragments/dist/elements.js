var o = Object.defineProperty;
var c = (s, i, e) => i in s ? o(s, i, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[i] = e;
var n = (s, i, e) => c(s, typeof i != "symbol" ? i + "" : i, e);
import { reframed as d } from "reframed";
class l extends HTMLElement {
  constructor() {
    super();
    n(this, "iframe");
    n(this, "ready");
    n(this, "isInitialized", !1);
    n(this, "isPortaling", !1);
    this.handlePiercing = this.handlePiercing.bind(this);
  }
  async connectedCallback() {
    if (!this.isInitialized) {
      this.isInitialized = !0;
      const { iframe: e, ready: t } = d(
        this.shadowRoot ?? document.location.href,
        {
          container: this,
          headers: { "x-fragment-mode": "embedded" }
        }
      );
      this.iframe = e, this.ready = t, document.addEventListener("fragment-outlet-ready", this.handlePiercing);
    }
  }
  async disconnectedCallback() {
    if (this.isPortaling) {
      this.isPortaling = !1;
      return;
    }
    this.iframe && !this.isPortaling && (this.iframe.remove(), this.iframe = void 0, document.removeEventListener(
      "fragment-outlet-ready",
      this.handlePiercing
    ));
  }
  async handlePiercing(e) {
    var a;
    if (e.defaultPrevented || e.target.getAttribute("fragment-id") !== this.getAttribute("fragment-id"))
      return;
    e.preventDefault(), await this.ready, this.neutralizeScriptTags(), this.preserveStylesheets();
    const t = (a = this.shadowRoot) == null ? void 0 : a.activeElement, r = this.getSelectionRange();
    this.isPortaling = !0, e.target.replaceChildren(this), t && t.focus(), r && this.setSelectionRange(r), this.restoreScriptTags(), this.removeAttribute("data-piercing");
  }
  preserveStylesheets() {
    this.shadowRoot && (this.shadowRoot.adoptedStyleSheets = Array.from(
      this.shadowRoot.styleSheets,
      (e) => {
        const t = new CSSStyleSheet();
        return [...e.cssRules].forEach(
          (r) => t.insertRule(r.cssText, t.cssRules.length)
        ), t;
      }
    ));
  }
  neutralizeScriptTags() {
    [...this.shadowRoot.querySelectorAll("script")].forEach((t) => {
      const r = t.getAttribute("type");
      r && t.setAttribute("data-script-type", r), t.setAttribute("type", "inert");
    });
  }
  restoreScriptTags() {
    [...this.shadowRoot.querySelectorAll("script")].forEach((t) => {
      t.removeAttribute("type");
      const r = t.getAttribute("data-script-type");
      r && t.setAttribute("type", r), t.removeAttribute("data-script-type");
    });
  }
  // Make a best-effort attempt at capturing selection state.
  // Note that ShadowRoot.getSelection() is only supported in Chromium browsers.
  // Also, Selection.getRangeAt() has unspecified behavior for selections that
  // span across shadow root boundaries. We can utilize
  // https://developer.mozilla.org/en-US/docs/Web/API/Selection/getComposedRanges
  // to help with this once it gets more browser support.
  getSelectionRange() {
    var e;
    try {
      return (e = this.shadowRoot.getSelection()) == null ? void 0 : e.getRangeAt(0);
    } catch {
      return null;
    }
  }
  setSelectionRange(e) {
    try {
      const t = this.shadowRoot.getSelection();
      t == null || t.removeAllRanges(), t == null || t.addRange(e);
    } catch {
    }
  }
}
class h extends HTMLElement {
  async connectedCallback() {
    const i = this.getAttribute("fragment-id");
    if (document.cookie = `fragment_id=${i};path=/`, !i)
      throw new Error(
        "The fragment outlet component has been applied without providing a fragment-id"
      );
    if (this.dispatchEvent(
      new Event("fragment-outlet-ready", { bubbles: !0, cancelable: !0 })
    )) {
      const t = document.createElement("fragment-host");
      t.setAttribute("fragment-id", i), this.appendChild(t);
    }
  }
  disconnectedCallback() {
    const i = this.getAttribute("fragment-id");
    document.cookie = `fragment_id=${i};path=/;expires=0`;
  }
  // private reapplyFragmentModuleScripts(fragmentId: string) {
  //   if (unmountedFragmentIds.has(fragmentId)) {
  //     this.querySelectorAll('script').forEach(script => {
  //       if (script.src && script.type === 'module') {
  //         import(/* @vite-ignore */ script.src).then(
  //           scriptModule => scriptModule.default?.()
  //         );
  //       }
  //     });
  //   }
  // }
}
function f() {
  window.customElements.define("fragment-outlet", h), window.customElements.define("fragment-host", l);
}
export {
  l as FragmentHost,
  h as FragmentOutlet,
  f as register
};
