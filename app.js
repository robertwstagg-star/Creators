(function () {
  "use strict";

  var APP_ROOT = document.getElementById("app");
  var REGISTRY_URLS = ["/data/creators.json", "/creators.json"];
  var registryCache = null;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolvePath() {
    var stored = sessionStorage.getItem("creators-spa-path");
    if (stored) {
      sessionStorage.removeItem("creators-spa-path");
      try {
        history.replaceState(null, "", stored);
      } catch (e) {
        /* ignore */
      }
      return stored.split("?")[0].split("#")[0];
    }
    return location.pathname;
  }

  function parseRoute(pathname) {
    var path = (pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "" || path === "/" || path === "/index.html" || path === "/404.html") {
      return { type: "home" };
    }
    var match = path.match(/^\/c\/([a-z0-9][a-z0-9-]{0,62})$/i);
    if (match) {
      return { type: "creator", slug: match[1].toLowerCase() };
    }
    return { type: "notfound" };
  }

  function loadRegistry() {
    if (registryCache) {
      return Promise.resolve(registryCache);
    }

    function tryUrl(index) {
      if (index >= REGISTRY_URLS.length) {
        return Promise.reject(new Error("Could not load creators"));
      }
      return fetch(REGISTRY_URLS[index], { cache: "no-cache" }).then(function (res) {
        if (!res.ok) return tryUrl(index + 1);
        return res.json().then(function (data) {
          registryCache = data;
          return data;
        });
      });
    }

    return tryUrl(0);
  }

  function findCreator(data, slug) {
    var list = (data && data.creators) || [];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c && String(c.slug).toLowerCase() === slug && c.status !== "inactive") {
        return c;
      }
    }
    return null;
  }

  function publicPageUrl(slug) {
    return "https://creators.trekstakapp.com/c/" + encodeURIComponent(slug);
  }

  function qrImageUrl(pageUrl) {
    return (
      "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=" +
      encodeURIComponent(pageUrl)
    );
  }

  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function setToast(el, message) {
    if (!el) return;
    el.textContent = message || "";
    if (message) {
      window.clearTimeout(el._toastTimer);
      el._toastTimer = window.setTimeout(function () {
        el.textContent = "";
      }, 2200);
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  function renderHome(data) {
    var creators = ((data && data.creators) || []).filter(function (c) {
      return c && c.status !== "inactive";
    });

    var listHtml =
      creators.length === 0
        ? '<p class="muted">Founding creators will appear here as they go live.</p>'
        : '<ul class="creator-list">' +
          creators
            .map(function (c) {
              return (
                '<li><a href="/c/' +
                encodeURIComponent(c.slug) +
                '"><strong>' +
                escapeHtml(c.displayName) +
                "</strong><span>" +
                escapeHtml(c.role || c.handle || "") +
                "</span></a></li>"
              );
            })
            .join("") +
          "</ul>";

    APP_ROOT.innerHTML =
      '<section class="home-card">' +
      '<p class="eyebrow">Creator Hub</p>' +
      "<h1>Official TrekStak creator pages</h1>" +
      '<p class="lede">Each founding creator gets a public page with their promo code, profile, and App Store link — made for bio links and QR codes.</p>' +
      listHtml +
      "</section>";
  }

  function renderNotFound(message) {
    APP_ROOT.innerHTML =
      '<section class="error">' +
      "<h1>Page not found</h1>" +
      '<p class="muted">' +
      escapeHtml(message || "That creator page does not exist yet.") +
      "</p>" +
      '<p><a href="/">Back to Creators</a></p>' +
      "</section>";
  }

  function renderCreator(creator) {
    var pageUrl = publicPageUrl(creator.slug);
    var code = creator.promoCode || "";
    var discount = creator.discountLabel || "20% off your first year";
    var storeUrl = creator.appStoreUrl || "https://apps.apple.com/app/trekstak/id6758947030";
    var socials = creator.socials || {};
    var posts = ((creator.posts || creator.featuredContent || [])
      .filter(function (p) {
        return p && p.status !== "draft";
      })
      .slice()
      .sort(function (a, b) {
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      }));

    var avatarHtml = creator.avatarUrl
      ? '<img class="avatar" src="' +
        escapeHtml(creator.avatarUrl) +
        '" alt="" width="72" height="72" />'
      : '<div class="avatar avatar-fallback" aria-hidden="true">' +
        escapeHtml(initials(creator.displayName)) +
        "</div>";

    var socialHtml = "";
    if (socials.instagram) {
      socialHtml +=
        '<a class="social-link" href="' +
        escapeHtml(socials.instagram) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<img src="/Instagram_Glyph_Gradient.png" alt="" /> Instagram</a>';
    }
    if (socials.tiktok) {
      socialHtml +=
        '<a class="social-link" href="' +
        escapeHtml(socials.tiktok) +
        '" target="_blank" rel="noopener noreferrer">TikTok</a>';
    }
    if (socials.youtube) {
      socialHtml +=
        '<a class="social-link" href="' +
        escapeHtml(socials.youtube) +
        '" target="_blank" rel="noopener noreferrer">YouTube</a>';
    }

    var postsHtml = "";
    if (posts.length) {
      postsHtml =
        '<section class="panel posts-panel"><h2>From ' +
        escapeHtml(creator.displayName) +
        "</h2>" +
        '<div class="post-list">' +
        posts
          .map(function (post) {
            var showCode = post.showPromoCode !== false && code;
            var ctaLabel = post.ctaLabel || "Get TrekStak";
            var tags = post.tags || [];
            var dateLabel = post.publishedAt || "";
            var imageBlock = post.imageUrl
              ? '<img class="post-image" src="' +
                escapeHtml(post.imageUrl) +
                '" alt="' +
                escapeHtml(post.imageAlt || "") +
                '" loading="lazy" />'
              : "";
            var tagsBlock = tags.length
              ? '<p class="post-tags">' +
                tags
                  .map(function (t) {
                    return '<span class="post-tag">' + escapeHtml(t) + "</span>";
                  })
                  .join("") +
                "</p>"
              : "";
            return (
              '<article class="post-card">' +
              imageBlock +
              '<div class="post-body">' +
              (dateLabel
                ? '<p class="post-date">' + escapeHtml(dateLabel) + "</p>"
                : "") +
              "<h3>" +
              escapeHtml(post.title || "Update") +
              "</h3>" +
              '<p class="post-text">' +
              escapeHtml(post.body || "") +
              "</p>" +
              tagsBlock +
              '<div class="post-cta">' +
              '<a class="btn btn-primary" href="' +
              escapeHtml(storeUrl) +
              '" rel="noopener noreferrer">' +
              escapeHtml(ctaLabel) +
              "</a>" +
              (showCode
                ? '<p class="post-code">Code: <strong>' +
                  escapeHtml(code) +
                  "</strong></p>"
                : "") +
              "</div></div></article>"
            );
          })
          .join("") +
        "</div></section>";
    }

    document.title = creator.displayName + " — TrekStak Creator";

    APP_ROOT.innerHTML =
      '<article class="profile">' +
      '<div class="profile-head">' +
      avatarHtml +
      '<div class="profile-meta">' +
      '<h1 class="profile-name">' +
      escapeHtml(creator.displayName) +
      "</h1>" +
      (creator.handle
        ? '<p class="handle">' + escapeHtml(creator.handle) + "</p>"
        : "") +
      (creator.role
        ? '<span class="role-chip">' + escapeHtml(creator.role) + "</span>"
        : "") +
      "</div></div>" +
      (creator.bio ? '<p class="bio">' + escapeHtml(creator.bio) + "</p>" : "") +
      '<section class="panel">' +
      "<h2>Promo code</h2>" +
      '<div class="code-row">' +
      '<p class="code-value" id="promo-code">' +
      escapeHtml(code) +
      "</p>" +
      '<button type="button" class="btn btn-primary" id="copy-code">Copy code</button>' +
      "</div>" +
      '<p class="discount">' +
      escapeHtml(discount) +
      "</p>" +
      '<p class="toast" id="code-toast" aria-live="polite"></p>' +
      "</section>" +
      postsHtml +
      '<section class="panel">' +
      "<h2>Get TrekStak</h2>" +
      '<div class="cta-store">' +
      '<a id="app-store-link" href="' +
      escapeHtml(storeUrl) +
      '" rel="noopener noreferrer">' +
      '<img class="app-store-badge" src="/apple-badge-black.png" width="158" height="54" alt="Download on the App Store" />' +
      "</a></div>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-ghost" id="copy-link">Copy page link</button>' +
      "</div>" +
      '<p class="toast" id="link-toast" aria-live="polite"></p>' +
      "</section>" +
      (socialHtml
        ? '<section class="panel"><h2>Follow</h2><div class="socials">' +
          socialHtml +
          "</div></section>"
        : "") +
      '<section class="panel">' +
      "<h2>QR code</h2>" +
      '<div class="qr-wrap">' +
      '<img id="qr-image" src="' +
      escapeHtml(qrImageUrl(pageUrl)) +
      '" width="160" height="160" alt="QR code for this creator page" />' +
      '<a class="btn btn-ghost" id="download-qr" href="' +
      escapeHtml(qrImageUrl(pageUrl)) +
      '" download="' +
      escapeHtml(creator.slug) +
      '-trekstak-qr.png">Download QR</a>' +
      "</div></section>" +
      "</article>";

    var copyCodeBtn = document.getElementById("copy-code");
    var copyLinkBtn = document.getElementById("copy-link");
    var codeToast = document.getElementById("code-toast");
    var linkToast = document.getElementById("link-toast");
    var downloadQr = document.getElementById("download-qr");

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", function () {
        copyText(code)
          .then(function () {
            setToast(codeToast, "Code copied");
          })
          .catch(function () {
            setToast(codeToast, "Could not copy");
          });
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", function () {
        copyText(pageUrl)
          .then(function () {
            setToast(linkToast, "Link copied");
          })
          .catch(function () {
            setToast(linkToast, "Could not copy");
          });
      });
    }

    if (downloadQr) {
      downloadQr.addEventListener("click", function (ev) {
        ev.preventDefault();
        var url = qrImageUrl(pageUrl);
        fetch(url)
          .then(function (res) {
            return res.blob();
          })
          .then(function (blob) {
            var objectUrl = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = objectUrl;
            a.download = creator.slug + "-trekstak-qr.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
          })
          .catch(function () {
            window.open(url, "_blank", "noopener,noreferrer");
          });
      });
    }
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-src="' + src + '"],script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.setAttribute("data-src", src);
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureCreatorStore() {
    if (window.CreatorPublicStore && CreatorPublicStore.mergePublicFieldsAsync) {
      return Promise.resolve();
    }
    var configReady = window.TrekStakFirebaseConfig
      ? Promise.resolve()
      : loadScriptOnce("/firebase-config.js").catch(function () {
          return loadScriptOnce("/js/firebase-config.js");
        });

    return configReady
      .then(function () {
        if (window.CreatorPublicStore) return;
        return loadScriptOnce("/creator-public-store.js").catch(function () {
          return loadScriptOnce("/js/creator-public-store.js");
        });
      })
      .catch(function (err) {
        console.warn("Could not load creator store scripts", err);
      });
  }

  function mergeCreator(creator) {
    return ensureCreatorStore().then(function () {
      if (window.CreatorPublicStore && CreatorPublicStore.mergePublicFieldsAsync) {
        return CreatorPublicStore.mergePublicFieldsAsync(creator);
      }
      if (window.CreatorPublicStore && CreatorPublicStore.mergePublicFields) {
        return Promise.resolve(CreatorPublicStore.mergePublicFields(creator));
      }
      return creator;
    });
  }

  function boot() {
    var route = parseRoute(resolvePath());

    loadRegistry()
      .then(function (data) {
        if (route.type === "home") {
          renderHome(data);
          document.title = "TrekStak Creators";
          return;
        }
        if (route.type === "creator") {
          var creator = findCreator(data, route.slug);
          if (!creator) {
            renderNotFound("No active creator found for /c/" + route.slug);
            document.title = "Not found — TrekStak Creators";
            return;
          }
          return mergeCreator(creator).then(function (merged) {
            renderCreator(merged);
          });
        }
        renderNotFound();
        document.title = "Not found — TrekStak Creators";
      })
      .catch(function () {
        APP_ROOT.innerHTML =
          '<section class="error"><h1>Something went wrong</h1>' +
          '<p class="muted">Could not load the creator registry. Try again in a moment.</p></section>';
      });
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (!href.startsWith("/")) return;
    if (a.target === "_blank" || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    history.pushState(null, "", href);
    boot();
  });

  window.addEventListener("popstate", boot);
  boot();
})();
