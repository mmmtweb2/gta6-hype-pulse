/* GTA 6 Hype Pulse — traffic pings only. No personal data, IPs, or raw URLs are sent. */
(function () {
  const NS = "gta6hp-ab8d44a8";
  const BASE = "https://abacus.jasoncameron.dev";
  const UNIQUE_KEY = "gta6hp-visitor";
  const TIMEOUT_MS = 4000;

  function hostname() {
    return (location.hostname || "").toLowerCase();
  }

  function isLocal() {
    const h = hostname();
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "";
  }

  function israelDate() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hebron",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function querySource() {
    try {
      const q = new URLSearchParams(location.search);
      return (q.get("src") || q.get("utm_source") || "").toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function bucketFromHost(host) {
    if (!host) return null;
    if (host === "t.co" || host === "x.com" || host === "www.x.com" || host.endsWith(".x.com") || host === "twitter.com" || host === "www.twitter.com" || host.endsWith(".twitter.com")) {
      return "x";
    }
    if (host === "google.com" || host === "www.google.com" || host.endsWith(".google.com") || /^google\./.test(host) || host.includes("google.")) {
      return "google";
    }
    if (host === "facebook.com" || host === "www.facebook.com" || host === "m.facebook.com" || host === "lm.facebook.com" || host === "l.facebook.com" || host === "fb.com" || host === "www.fb.com" || host.endsWith(".facebook.com")) {
      return "facebook";
    }
    if (host === "t.me" || host === "telegram.org" || host === "www.telegram.org" || host === "web.telegram.org" || host.endsWith(".telegram.org") || host === "telegram.me") {
      return "telegram";
    }
    return null;
  }

  function referrerBucket() {
    const src = querySource();
    if (src === "x" || src === "twitter" || src === "t.co") return "x";
    if (src === "google") return "google";
    if (src === "facebook" || src === "fb") return "facebook";
    if (src === "telegram" || src === "tg") return "telegram";

    const ref = document.referrer || "";
    if (!ref) return "direct";
    let host = "";
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return "other"; }
    if (host === hostname() || host === "www." + hostname()) return "direct";
    return bucketFromHost(host) || "other";
  }

  async function request(path) {
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    try {
      const res = await fetch(BASE + path, { signal: ctrl.signal, cache: "no-store" });
      if (res.status === 404) return 0;
      if (!res.ok) throw new Error("abacus " + res.status);
      const data = await res.json();
      const value = Number(data && data.value);
      return Number.isFinite(value) ? value : 0;
    } finally {
      clearTimeout(t);
    }
  }

  function get(key) {
    return request("/get/" + encodeURIComponent(NS) + "/" + encodeURIComponent(key));
  }

  function hit(key) {
    if (isLocal()) return get(key);
    return request("/hit/" + encodeURIComponent(NS) + "/" + encodeURIComponent(key));
  }

  function trackPageview() {
    const jobs = [
      hit("views"),
      hit("day-" + israelDate()),
      hit("ref-" + referrerBucket()),
    ];
    try {
      if (!localStorage.getItem(UNIQUE_KEY)) {
        localStorage.setItem(UNIQUE_KEY, "1");
        jobs.push(hit("uniques"));
      }
    } catch (e) {
      jobs.push(hit("uniques"));
    }
    Promise.all(jobs).catch(function () {});
  }

  function trackKind(kind) {
    const key = kind === "cta" ? "click-cta" : "click-stream";
    hit(key).catch(function () {});
  }

  document.addEventListener("click", function (event) {
    const el = event.target && event.target.closest
      ? event.target.closest("[data-track], #streams a[href], #follow a")
      : null;
    if (!el) return;
    const explicit = (el.getAttribute("data-track") || "").toLowerCase();
    if (explicit === "cta" || el.closest("#follow")) trackKind("cta");
    else trackKind("stream");
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageview);
  } else {
    trackPageview();
  }

  window.Gta6PulseTrack = { get: get, hit: hit, namespace: NS };
})();
