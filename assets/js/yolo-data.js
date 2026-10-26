/* =========================================================================
   YOLO Eats — shared data layer  (used by both index.html and admin/)
   -------------------------------------------------------------------------
   Reads the restaurant settings and menu from, in order:
     1. Supabase   (when assets/js/yolo-config.js has a url + anonKey)
     2. data/site.json
     3. nothing    -> the site falls back to the menu built into index.html

   No build step, no framework, no SDK: plain fetch against the Supabase
   REST + Auth endpoints so the whole thing stays a static upload.
   ========================================================================= */
(function (global) {
  "use strict";

  var CFG = global.YOLO_SUPABASE || {};
  var URL_ = (CFG.url || "").replace(/\/+$/, "");
  var KEY = CFG.anonKey || "";
  var TOKEN_STORE = "yolo-admin-session";

  var hasCloud = !!(URL_ && KEY);

  /* ----------------------------------------------------------- session */
  function readSession() {
    try { return JSON.parse(localStorage.getItem(TOKEN_STORE) || "null"); }
    catch (e) { return null; }
  }
  function writeSession(s) {
    try {
      if (s) localStorage.setItem(TOKEN_STORE, JSON.stringify(s));
      else localStorage.removeItem(TOKEN_STORE);
    } catch (e) {}
  }

  function authHeaders(withToken) {
    var h = { apikey: KEY, "Content-Type": "application/json" };
    var s = withToken !== false && readSession();
    h.Authorization = "Bearer " + (s && s.access_token ? s.access_token : KEY);
    return h;
  }

  async function refresh() {
    var s = readSession();
    if (!s || !s.refresh_token) return null;
    var r = await fetch(URL_ + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { writeSession(null); return null; }
    var j = await r.json();
    writeSession(j);
    return j;
  }

  /* Fetch against the REST API, retrying once after a token refresh. */
  async function rest(path, opts, retried) {
    opts = opts || {};
    var r = await fetch(URL_ + "/rest/v1/" + path, {
      method: opts.method || "GET",
      headers: Object.assign(authHeaders(), opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (r.status === 401 && !retried && readSession()) {
      if (await refresh()) return rest(path, opts, true);
    }
    if (!r.ok) {
      var text = await r.text().catch(function () { return ""; });
      throw new Error("Supabase " + r.status + ": " + text.slice(0, 300));
    }
    return r.status === 204 ? null : r.json();
  }

  /* ------------------------------------------------------------- shapes */
  // DB rows -> the shape index.html already understands
  function rowsToPayload(settings, cats, items) {
    var byCat = {};
    (items || []).forEach(function (it) {
      (byCat[it.category_id] = byCat[it.category_id] || []).push(it);
    });

    var photos = {}, mustTry = [];
    var menu = (cats || [])
      .filter(function (c) { return c.active !== false; })
      .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); })
      .map(function (c) {
        var list = (byCat[c.id] || [])
          .filter(function (i) { return i.active !== false; })
          .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); })
          .map(function (i) {
            var out = { n: i.name };
            if (i.descr) out.d = i.descr;
            if (i.price_variants && Object.keys(i.price_variants).length) out.p = i.price_variants;
            else out.p = (i.price === null || i.price === undefined || i.price === "") ? null : Number(i.price);
            if (i.tags && i.tags.length) out.tags = i.tags;
            if (i.image) { out.img = i.image; photos[i.name] = i.image; }
            if (i.featured) mustTry.push(slug(i.name));
            return out;
          });
        var cat = { id: c.id, name: c.name, items: list };
        if (c.name_hi) cat.hi = c.name_hi;
        if (c.sub) cat.sub = c.sub;
        return cat;
      })
      .filter(function (c) { return c.items.length; });

    return {
      config: (settings && settings.data) || {},
      menu: menu,
      photos: photos,
      mustTry: mustTry
    };
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // payload -> DB rows, for publishing from the admin panel
  function payloadToRows(p) {
    var cats = [], items = [];
    var featured = {};
    (p.mustTry || []).forEach(function (id) { featured[id] = true; });

    (p.menu || []).forEach(function (c, ci) {
      cats.push({
        id: c.id, name: c.name, name_hi: c.hi || null,
        sub: c.sub || null, sort: ci, active: true
      });
      (c.items || []).forEach(function (it, ii) {
        var variants = (it.p && typeof it.p === "object") ? it.p : null;
        items.push({
          category_id: c.id,
          name: it.n,
          descr: it.d || null,
          price: variants ? null : (it.p === null || it.p === undefined ? null : Number(it.p)),
          price_variants: variants,
          tags: it.tags || [],
          image: it.img || (p.photos && p.photos[it.n]) || null,
          sort: ii,
          active: true,
          featured: !!featured[slug(it.n)]
        });
      });
    });
    return { cats: cats, items: items };
  }

  /* --------------------------------------------------------------- load */
  async function loadCloud() {
    var res = await Promise.all([
      rest("site_settings?id=eq.1&select=*"),
      rest("menu_categories?select=*&order=sort.asc"),
      rest("menu_items?select=*&order=sort.asc")
    ]);
    return rowsToPayload(res[0] && res[0][0], res[1], res[2]);
  }

  /* Works from the site root and from any one-level subfolder (/admin/, /menu/). */
  async function loadFile() {
    var tries = ["data/site.json", "../data/site.json", "/data/site.json"];
    for (var i = 0; i < tries.length; i++) {
      try {
        var r = await fetch(tries[i], { cache: "no-store" });
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    throw new Error("data/site.json could not be read");
  }

  async function load() {
    if (hasCloud) {
      try {
        var d = await loadCloud();
        if (d && d.menu && d.menu.length) { d.source = "supabase"; return d; }
      } catch (e) { console.warn("[YOLO] Supabase read failed, trying data/site.json", e); }
    }
    try {
      var f = await loadFile();
      f.source = "file";
      return f;
    } catch (e) { return null; }
  }

  /* --------------------------------------------------------------- auth */
  async function signIn(email, password) {
    if (!hasCloud) throw new Error("Supabase is not configured yet.");
    var r = await fetch(URL_ + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    var j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "Sign in failed");
    writeSession(j);
    return j;
  }

  async function signOut() {
    var s = readSession();
    if (hasCloud && s && s.access_token) {
      try {
        await fetch(URL_ + "/auth/v1/logout", {
          method: "POST",
          headers: { apikey: KEY, Authorization: "Bearer " + s.access_token }
        });
      } catch (e) {}
    }
    writeSession(null);
  }

  async function currentUser() {
    var s = readSession();
    if (!hasCloud || !s) return null;
    try {
      var r = await fetch(URL_ + "/auth/v1/user", { headers: authHeaders() });
      if (r.status === 401) {
        if (!(await refresh())) return null;
        r = await fetch(URL_ + "/auth/v1/user", { headers: authHeaders() });
      }
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------ publish */
  async function publish(payload) {
    if (!hasCloud) throw new Error("Supabase is not configured yet.");
    var rows = payloadToRows(payload);

    await rest("site_settings?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: [{ id: 1, data: payload.config || {}, updated_at: new Date().toISOString() }]
    });

    // Replace the menu wholesale — items cascade off their category.
    await rest("menu_items?id=not.is.null", { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await rest("menu_categories?id=not.is.null", { method: "DELETE", headers: { Prefer: "return=minimal" } });

    if (rows.cats.length) {
      await rest("menu_categories", {
        method: "POST", headers: { Prefer: "return=minimal" }, body: rows.cats
      });
    }
    if (rows.items.length) {
      // chunked so a very long menu never blows the request size
      for (var i = 0; i < rows.items.length; i += 200) {
        await rest("menu_items", {
          method: "POST", headers: { Prefer: "return=minimal" },
          body: rows.items.slice(i, i + 200)
        });
      }
    }
    return true;
  }

  global.YoloData = {
    hasCloud: hasCloud,
    load: load,
    loadCloud: loadCloud,
    loadFile: loadFile,
    signIn: signIn,
    signOut: signOut,
    currentUser: currentUser,
    publish: publish,
    slug: slug,
    payloadToRows: payloadToRows
  };
})(window);
