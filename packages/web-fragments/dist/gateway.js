var $ = Object.defineProperty;
var b = (r) => {
  throw TypeError(r);
};
var W = (r, n, e) => n in r ? $(r, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[n] = e;
var N = (r, n, e) => W(r, typeof n != "symbol" ? n + "" : n, e), S = (r, n, e) => n.has(r) || b("Cannot " + e);
var D = (r, n, e) => (S(r, n, "read from private field"), e ? e.call(r) : n.get(r)), O = (r, n, e) => n.has(r) ? b("Cannot add the same private member more than once") : n instanceof WeakSet ? n.add(r) : n.set(r, e), _ = (r, n, e, t) => (S(r, n, "write to private field"), t ? t.call(r, e) : n.set(r, e), e);
function U(r) {
  for (var n = [], e = 0; e < r.length; ) {
    var t = r[e];
    if (t === "*" || t === "+" || t === "?") {
      n.push({ type: "MODIFIER", index: e, value: r[e++] });
      continue;
    }
    if (t === "\\") {
      n.push({ type: "ESCAPED_CHAR", index: e++, value: r[e++] });
      continue;
    }
    if (t === "{") {
      n.push({ type: "OPEN", index: e, value: r[e++] });
      continue;
    }
    if (t === "}") {
      n.push({ type: "CLOSE", index: e, value: r[e++] });
      continue;
    }
    if (t === ":") {
      for (var u = "", a = e + 1; a < r.length; ) {
        var c = r.charCodeAt(a);
        if (
          // `0-9`
          c >= 48 && c <= 57 || // `A-Z`
          c >= 65 && c <= 90 || // `a-z`
          c >= 97 && c <= 122 || // `_`
          c === 95
        ) {
          u += r[a++];
          continue;
        }
        break;
      }
      if (!u)
        throw new TypeError("Missing parameter name at ".concat(e));
      n.push({ type: "NAME", index: e, value: u }), e = a;
      continue;
    }
    if (t === "(") {
      var p = 1, v = "", a = e + 1;
      if (r[a] === "?")
        throw new TypeError('Pattern cannot start with "?" at '.concat(a));
      for (; a < r.length; ) {
        if (r[a] === "\\") {
          v += r[a++] + r[a++];
          continue;
        }
        if (r[a] === ")") {
          if (p--, p === 0) {
            a++;
            break;
          }
        } else if (r[a] === "(" && (p++, r[a + 1] !== "?"))
          throw new TypeError("Capturing groups are not allowed at ".concat(a));
        v += r[a++];
      }
      if (p)
        throw new TypeError("Unbalanced pattern at ".concat(e));
      if (!v)
        throw new TypeError("Missing pattern at ".concat(e));
      n.push({ type: "PATTERN", index: e, value: v }), e = a;
      continue;
    }
    n.push({ type: "CHAR", index: e, value: r[e++] });
  }
  return n.push({ type: "END", index: e, value: "" }), n;
}
function L(r, n) {
  n === void 0 && (n = {});
  for (var e = U(r), t = n.prefixes, u = t === void 0 ? "./" : t, a = "[^".concat(T(n.delimiter || "/#?"), "]+?"), c = [], p = 0, v = 0, o = "", f = function(s) {
    if (v < e.length && e[v].type === s)
      return e[v++].value;
  }, g = function(s) {
    var E = f(s);
    if (E !== void 0)
      return E;
    var w = e[v], P = w.type, I = w.index;
    throw new TypeError("Unexpected ".concat(P, " at ").concat(I, ", expected ").concat(s));
  }, m = function() {
    for (var s = "", E; E = f("CHAR") || f("ESCAPED_CHAR"); )
      s += E;
    return s;
  }; v < e.length; ) {
    var d = f("CHAR"), y = f("NAME"), R = f("PATTERN");
    if (y || R) {
      var h = d || "";
      u.indexOf(h) === -1 && (o += h, h = ""), o && (c.push(o), o = ""), c.push({
        name: y || p++,
        prefix: h,
        suffix: "",
        pattern: R || a,
        modifier: f("MODIFIER") || ""
      });
      continue;
    }
    var l = d || f("ESCAPED_CHAR");
    if (l) {
      o += l;
      continue;
    }
    o && (c.push(o), o = "");
    var A = f("OPEN");
    if (A) {
      var h = m(), C = f("NAME") || "", i = f("PATTERN") || "", x = m();
      g("CLOSE"), c.push({
        name: C || (i ? p++ : ""),
        pattern: C && !i ? a : i,
        prefix: h,
        suffix: x,
        modifier: f("MODIFIER") || ""
      });
      continue;
    }
    g("END");
  }
  return c;
}
function B(r, n) {
  var e = [], t = H(r, e, n);
  return G(t, e, n);
}
function G(r, n, e) {
  e === void 0 && (e = {});
  var t = e.decode, u = t === void 0 ? function(a) {
    return a;
  } : t;
  return function(a) {
    var c = r.exec(a);
    if (!c)
      return !1;
    for (var p = c[0], v = c.index, o = /* @__PURE__ */ Object.create(null), f = function(m) {
      if (c[m] === void 0)
        return "continue";
      var d = n[m - 1];
      d.modifier === "*" || d.modifier === "+" ? o[d.name] = c[m].split(d.prefix + d.suffix).map(function(y) {
        return u(y, d);
      }) : o[d.name] = u(c[m], d);
    }, g = 1; g < c.length; g++)
      f(g);
    return { path: p, index: v, params: o };
  };
}
function T(r) {
  return r.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function F(r) {
  return r && r.sensitive ? "" : "i";
}
function j(r, n) {
  if (!n)
    return r;
  for (var e = /\((?:\?<(.*?)>)?(?!\?)/g, t = 0, u = e.exec(r.source); u; )
    n.push({
      // Use parenthesized substring match if available, index otherwise
      name: u[1] || t++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    }), u = e.exec(r.source);
  return r;
}
function q(r, n, e) {
  var t = r.map(function(u) {
    return H(u, n, e).source;
  });
  return new RegExp("(?:".concat(t.join("|"), ")"), F(e));
}
function z(r, n, e) {
  return J(L(r, e), n, e);
}
function J(r, n, e) {
  e === void 0 && (e = {});
  for (var t = e.strict, u = t === void 0 ? !1 : t, a = e.start, c = a === void 0 ? !0 : a, p = e.end, v = p === void 0 ? !0 : p, o = e.encode, f = o === void 0 ? function(I) {
    return I;
  } : o, g = e.delimiter, m = g === void 0 ? "/#?" : g, d = e.endsWith, y = d === void 0 ? "" : d, R = "[".concat(T(y), "]|$"), h = "[".concat(T(m), "]"), l = c ? "^" : "", A = 0, C = r; A < C.length; A++) {
    var i = C[A];
    if (typeof i == "string")
      l += T(f(i));
    else {
      var x = T(f(i.prefix)), s = T(f(i.suffix));
      if (i.pattern)
        if (n && n.push(i), x || s)
          if (i.modifier === "+" || i.modifier === "*") {
            var E = i.modifier === "*" ? "?" : "";
            l += "(?:".concat(x, "((?:").concat(i.pattern, ")(?:").concat(s).concat(x, "(?:").concat(i.pattern, "))*)").concat(s, ")").concat(E);
          } else
            l += "(?:".concat(x, "(").concat(i.pattern, ")").concat(s, ")").concat(i.modifier);
        else
          i.modifier === "+" || i.modifier === "*" ? l += "((?:".concat(i.pattern, ")").concat(i.modifier, ")") : l += "(".concat(i.pattern, ")").concat(i.modifier);
      else
        l += "(?:".concat(x).concat(s, ")").concat(i.modifier);
    }
  }
  if (v)
    u || (l += "".concat(h, "?")), l += e.endsWith ? "(?=".concat(R, ")") : "$";
  else {
    var w = r[r.length - 1], P = typeof w == "string" ? h.indexOf(w[w.length - 1]) > -1 : w === void 0;
    u || (l += "(?:".concat(h, "(?=").concat(R, "))?")), P || (l += "(?=".concat(h, "|").concat(R, ")"));
  }
  return new RegExp(l, F(e));
}
function H(r, n, e) {
  return r instanceof RegExp ? j(r, n) : Array.isArray(r) ? q(r, n, e) : z(r, n, e);
}
var M;
class Q {
  constructor(n) {
    N(this, "fragmentConfigs", /* @__PURE__ */ new Map());
    N(this, "routeMap", /* @__PURE__ */ new Map());
    O(this, M);
    _(this, M, (n == null ? void 0 : n.prePiercingStyles) ?? "");
  }
  get prePiercingStyles() {
    return D(this, M);
  }
  /**
   * Registers a fragment in the gateway worker so that it can be integrated
   * with the gateway worker.
   *
   * @param fragmentConfig Configuration object for the fragment.
   */
  registerFragment(n) {
    if (this.fragmentConfigs.has(n.fragmentId)) {
      console.warn(
        `\x1B[31m Warning: you're trying to register a fragment with id "${n.fragmentId}", but a fragment with the same fragmentId has already been registered, thus this duplicate registration will be ignored. \x1B[0m`
      );
      return;
    }
    this.fragmentConfigs.set(n.fragmentId, n), n.routePatterns.forEach((e) => {
      const t = B(e, {
        decode: globalThis.decodeURIComponent
      });
      this.routeMap.set(t, n);
    });
  }
  matchRequestToFragment(n) {
    const e = new URL(
      n instanceof Request ? n.url : `${n}`
    ).pathname, t = [...this.routeMap.keys()].find((u) => u(e));
    return t ? this.routeMap.get(t) ?? null : null;
  }
}
M = new WeakMap();
export {
  Q as FragmentGateway
};
