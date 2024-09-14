const g = ({
  fragmentId: n,
  content: o,
  classNames: t
}) => `
<fragment-host class="${t}" fragment-id="${n}" data-piercing="true">
  <template shadowrootmode="open">${o}</template>
</fragment-host>`;
function w(n, o = "development") {
  return async ({ request: t, next: l }) => {
    var h;
    if (t.headers.get("sec-fetch-dest") === "iframe" && n.matchRequestToFragment(t))
      return new Response("<!doctype html><title>");
    if (t.headers.get("sec-fetch-dest") !== "document") {
      const r = n.matchRequestToFragment(t);
      if (r) {
        const s = new URL(t.url), d = new URL(
          `${s.pathname}${s.search}`,
          r.upstream
        );
        return fetch(d, t);
      }
    }
    const p = await l();
    if (!!((h = p.headers.get("content-type")) != null && h.startsWith("text/html"))) {
      const r = n.matchRequestToFragment(t);
      if (r) {
        const s = new URL(t.url), d = new URL(
          `${s.pathname}${s.search}`,
          r.upstream
        ), f = new HTMLRewriter().on("script", {
          element(e) {
            const m = e.getAttribute("type");
            m && e.setAttribute("data-script-type", m), e.setAttribute("type", "inert");
          }
        }), a = new Request(d, t);
        a.headers.set("sec-fetch-dest", "empty"), a.headers.set("x-fragment-mode", "embedded"), o === "development" && a.headers.set("Accept-Encoding", "gzip");
        let c, i = null;
        try {
          const e = await fetch(a);
          e.status >= 400 && e.status <= 599 ? i = e : c = f.transform(e);
        } catch (e) {
          i = e;
        }
        if (i)
          if (r.onSsrFetchError) {
            const { response: e, overrideResponse: m } = await r.onSsrFetchError(
              a,
              i
            );
            if (m)
              return e;
            c = e;
          } else
            c = new Response(
              o === "development" ? `<p>Fetching fragment upstream failed: ${r.upstream}</p>` : "<p>There was a problem fulfilling your request.</p>",
              { headers: [["content-type", "text/html"]] }
            );
        return new HTMLRewriter().on("head", {
          element(e) {
            e.append(n.prePiercingStyles, { html: !0 });
          }
        }).on("body", {
          async element(e) {
            e.append(
              g({
                fragmentId: r.fragmentId,
                // TODO: what if don't get a body (i.e. can't fetch the fragment)? we should add some error handling here
                content: await c.text(),
                classNames: r.prePiercingClassNames.join(" ")
              }),
              { html: !0 }
            );
          }
        }).transform(p);
      }
    }
    return p;
  };
}
export {
  w as getMiddleware
};
