(function () {
  "use strict";

  var APP_ROOT = document.getElementById("app");
  var REGISTRY_URLS = ["/data/creators.json", "/creators.json"];
  var CITY_URLS = ["/data/trekstak-cities.json?v=3", "/trekstak-cities.json?v=3"];
  var registryCache = null;
  var cityByName = null;

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
    var path = location.pathname;
    if (path.indexOf("/creators/") === 0) {
      path = path.slice("/creators".length) || "/";
    }
    return path;
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

  function loadCityLookup() {
    if (cityByName) {
      return Promise.resolve(cityByName);
    }

    function tryUrl(index) {
      if (index >= CITY_URLS.length) {
        cityByName = {};
        return Promise.resolve(cityByName);
      }
      return fetch(CITY_URLS[index], { cache: "force-cache" })
        .then(function (res) {
          if (!res.ok) throw new Error("next");
          return res.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.cities)) throw new Error("next");
          var map = {};
          data.cities.forEach(function (c) {
            if (c && c.name) {
              map[String(c.name).toLowerCase()] = c;
            }
          });
          cityByName = map;
          return cityByName;
        })
        .catch(function () {
          return tryUrl(index + 1);
        });
    }

    return tryUrl(0);
  }

  function enrichTrip(trip) {
    if (!trip || !trip.city || !cityByName) return trip;
    if (trip.flag && trip.country) return trip;
    var match = cityByName[String(trip.city).toLowerCase()];
    if (!match) return trip;
    return Object.assign({}, trip, {
      country: trip.country || match.country || "",
      flag: trip.flag || match.flag || "",
      inTrekstak: trip.inTrekstak != null ? trip.inTrekstak : true
    });
  }

  function enrichCityOfTheWeek(pick) {
    if (!pick || !pick.city) return pick;
    if ((pick.flag && pick.country) || !cityByName) return pick;
    var match = cityByName[String(pick.city).toLowerCase()];
    if (!match) return pick;
    return Object.assign({}, pick, {
      country: pick.country || match.country || "",
      flag: pick.flag || match.flag || "",
      inTrekstak: pick.inTrekstak != null ? pick.inTrekstak : true
    });
  }

  function enrichCityReview(review) {
    if (!review || !review.city) return review;
    var enriched = Object.assign({}, review);
    if ((!enriched.flag || !enriched.country) && cityByName) {
      var match = cityByName[String(review.city).toLowerCase()];
      if (match) {
        enriched.country = enriched.country || match.country || "";
        enriched.flag = enriched.flag || match.flag || "";
        enriched.inTrekstak = enriched.inTrekstak != null ? enriched.inTrekstak : true;
      }
    }
    return enriched;
  }

  function enrichLiveTrip(trip) {
    if (!trip || !trip.city) return trip;
    var enriched = Object.assign({}, trip);
    if ((!enriched.flag || !enriched.country) && cityByName) {
      var match = cityByName[String(trip.city).toLowerCase()];
      if (match) {
        enriched.country = enriched.country || match.country || "";
        enriched.flag = enriched.flag || match.flag || "";
        enriched.inTrekstak = enriched.inTrekstak != null ? enriched.inTrekstak : true;
      }
    }
    if (Array.isArray(enriched.days)) {
      enriched.days = enriched.days.slice().sort(function (a, b) {
        return a.dayNumber - b.dayNumber;
      });
    }
    return enriched;
  }

  var LIVE_TRIP_TAG_LABELS = {
    food: "Food",
    culture: "Culture",
    nightlife: "Nightlife",
    outdoors: "Outdoors",
    shopping: "Shopping",
    vibe: "Vibe",
    family: "Family",
    beach: "Beach",
    travel: "Getting there",
    stay: "Where we stayed",
    walk: "Walk day"
  };

  function liveTripTagLabel(id) {
    return LIVE_TRIP_TAG_LABELS[id] || id;
  }

  function starsDisplay(count) {
    var n = Math.max(0, Math.min(5, parseInt(count, 10) || 0));
    return "\u2605".repeat(n) + "\u2606".repeat(5 - n);
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
    var tripStatusLabel = {
      upcoming: "Upcoming",
      currently: "There now",
      "just-back": "Just back"
    };
    var tripStatusOrder = {
      currently: 0,
      upcoming: 1,
      "just-back": 2
    };
    var trips = (creator.tripRadar || [])
      .filter(function (t) {
        return t && t.city;
      })
      .map(enrichTrip)
      .slice()
      .sort(function (a, b) {
        var oa = tripStatusOrder[a.status] != null ? tripStatusOrder[a.status] : 9;
        var ob = tripStatusOrder[b.status] != null ? tripStatusOrder[b.status] : 9;
        if (oa !== ob) return oa - ob;
        return String(a.city || "").localeCompare(String(b.city || ""));
      });
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

    var cityOfTheWeekHtml = "";
    var cotw = enrichCityOfTheWeek(creator.cityOfTheWeek);
    if (cotw && cotw.city) {
      var cotwTips = (cotw.tips || []).filter(Boolean);
      var tipsHtml = cotwTips.length
        ? "<ul class=\"cotw-tips\">" +
          cotwTips
            .map(function (tip) {
              return "<li>" + escapeHtml(tip) + "</li>";
            })
            .join("") +
          "</ul>"
        : "";
      cityOfTheWeekHtml =
        '<section class="panel cotw-panel"><h2>City of the week</h2>' +
        '<article class="cotw-card">' +
        (cotw.photoUrl
          ? '<img class="cotw-photo" src="' +
            escapeHtml(cotw.photoUrl) +
            '" alt="" loading="lazy" />'
          : "") +
        '<div class="cotw-body">' +
        '<p class="cotw-city">' +
        (cotw.flag
          ? '<span class="trip-flag" aria-hidden="true">' + cotw.flag + "</span> "
          : "") +
        escapeHtml(cotw.city) +
        (cotw.country
          ? '<span class="trip-country">' + escapeHtml(cotw.country) + "</span>"
          : "") +
        "</p>" +
        (cotw.intro
          ? '<p class="cotw-intro">' + escapeHtml(cotw.intro) + "</p>"
          : "") +
        tipsHtml +
        "</div></article></section>";
    }

    var cityReviews = (creator.cityReviews || [])
      .slice()
      .map(enrichCityReview)
      .filter(function (r) {
        return r && r.city && r.ratings && r.ratings.length;
      })
      .sort(function (a, b) {
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });

    var cityReviewsHtml = "";
    if (cityReviews.length) {
      cityReviewsHtml =
        '<section class="panel city-reviews-panel"><h2>City ratings</h2>' +
        '<div class="city-reviews-list">' +
        cityReviews
          .map(function (review) {
            var ratingsHtml = (review.ratings || [])
              .map(function (r) {
                return (
                  '<div class="city-review-rating-line">' +
                  '<span class="city-review-cat">' +
                  escapeHtml(r.label || r.category) +
                  "</span>" +
                  '<span class="city-review-stars" aria-label="' +
                  escapeHtml(String(r.stars)) +
                  ' out of 5 stars">' +
                  starsDisplay(r.stars) +
                  "</span>" +
                  (r.why
                    ? '<span class="city-review-why">' + escapeHtml(r.why) + "</span>"
                    : "") +
                  "</div>"
                );
              })
              .join("");
            return (
              '<article class="city-review-card">' +
              '<p class="city-review-city">' +
              (review.flag
                ? '<span class="trip-flag" aria-hidden="true">' + review.flag + "</span> "
                : "") +
              escapeHtml(review.city) +
              (review.country
                ? '<span class="trip-country">' + escapeHtml(review.country) + "</span>"
                : "") +
              "</p>" +
              '<div class="city-review-ratings">' +
              ratingsHtml +
              "</div></article>"
            );
          })
          .join("") +
        "</div></section>";
    }

    var liveTripHtml = "";
    var liveTrip = enrichLiveTrip(creator.liveTrip);
    if (liveTrip && liveTrip.city && (liveTrip.status === "live" || liveTrip.status === "planning")) {
      var liveTripTitle =
        liveTrip.status === "live" ? "Live trip" : "Upcoming trip";
      var liveTripStatusNote =
        liveTrip.status === "planning"
          ? '<p class="live-trip-teaser">Starts soon — follow day by day here.</p>'
          : "";
      var daysHtml = (liveTrip.days || [])
        .map(function (day) {
          var tagsBlock = (day.tags || []).length
            ? '<p class="live-trip-day-tags">' +
              day.tags
                .map(function (t) {
                  return (
                    '<span class="post-tag">' + escapeHtml(liveTripTagLabel(t)) + "</span>"
                  );
                })
                .join("") +
              "</p>"
            : "";
          var photoBlock = day.photoUrl
            ? '<img class="live-trip-day-photo" src="' +
              escapeHtml(day.photoUrl) +
              '" alt="" loading="lazy" />'
            : "";
          var videoBlock = day.videoUrl
            ? '<video class="live-trip-day-video" controls playsinline preload="metadata" src="' +
              escapeHtml(day.videoUrl) +
              '"></video>'
            : "";
          var linkBlock = day.videoLinkUrl
            ? '<p class="live-trip-day-link"><a href="' +
              escapeHtml(day.videoLinkUrl) +
              '" target="_blank" rel="noopener noreferrer">Also on social</a></p>'
            : "";
          return (
            '<article class="live-trip-day">' +
            '<p class="live-trip-day-label">' +
            escapeHtml(day.label || "Day " + String(day.dayNumber)) +
            "</p>" +
            "<h3>" +
            escapeHtml(day.headline) +
            "</h3>" +
            (day.summary
              ? '<p class="live-trip-day-summary">' + escapeHtml(day.summary) + "</p>"
              : "") +
            tagsBlock +
            photoBlock +
            videoBlock +
            linkBlock +
            "</article>"
          );
        })
        .join("");
      liveTripHtml =
        '<section class="panel live-trip-panel"><h2>' +
        escapeHtml(liveTripTitle) +
        "</h2>" +
        '<article class="live-trip-card">' +
        (liveTrip.coverPhotoUrl
          ? '<img class="live-trip-cover" src="' +
            escapeHtml(liveTrip.coverPhotoUrl) +
            '" alt="" loading="lazy" />'
          : "") +
        '<div class="live-trip-body">' +
        '<p class="live-trip-city">' +
        (liveTrip.flag
          ? '<span class="trip-flag" aria-hidden="true">' + liveTrip.flag + "</span> "
          : "") +
        escapeHtml(liveTrip.title) +
        '<span class="trip-country">' +
        escapeHtml(liveTrip.city) +
        (liveTrip.country ? " · " + escapeHtml(liveTrip.country) : "") +
        "</span></p>" +
        (liveTrip.hook
          ? '<p class="live-trip-hook">' + escapeHtml(liveTrip.hook) + "</p>"
          : "") +
        liveTripStatusNote +
        (daysHtml
          ? '<div class="live-trip-timeline">' + daysHtml + "</div>"
          : '<p class="live-trip-empty">Updates will appear here as the trip goes live.</p>') +
        "</div></article></section>";
    }

    var tripRadarHtml = "";
    if (trips.length) {
      tripRadarHtml =
        '<section class="panel trip-radar-panel"><h2>Trip radar</h2>' +
        '<div class="trip-list">' +
        trips
          .map(function (trip) {
            var status = trip.status || "upcoming";
            var focus = trip.focus || [];
            var focusBlock = focus.length
              ? '<p class="trip-focus">' +
                focus
                  .map(function (f) {
                    return '<span class="post-tag">' + escapeHtml(f) + "</span>";
                  })
                  .join("") +
                "</p>"
              : "";
            return (
              '<article class="trip-card">' +
              '<div class="trip-card-top">' +
              "<h3>" +
              (trip.flag
                ? '<span class="trip-flag" aria-hidden="true">' +
                  trip.flag +
                  "</span> "
                : "") +
              escapeHtml(trip.city) +
              (trip.country
                ? '<span class="trip-country">' +
                  escapeHtml(trip.country) +
                  "</span>"
                : "") +
              "</h3>" +
              '<span class="trip-status trip-status--' +
              escapeHtml(status) +
              '">' +
              escapeHtml(tripStatusLabel[status] || status) +
              "</span>" +
              "</div>" +
              (trip.when
                ? '<p class="trip-when">' + escapeHtml(trip.when) + "</p>"
                : "") +
              (trip.why
                ? '<p class="trip-why">' + escapeHtml(trip.why) + "</p>"
                : "") +
              focusBlock +
              "</article>"
            );
          })
          .join("") +
        "</div></section>";
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
            var videoBlock = post.videoUrl
              ? '<video class="post-video" controls playsinline preload="metadata" src="' +
                escapeHtml(post.videoUrl) +
                '"></video>'
              : "";
            var videoLinkBlock = post.videoLinkUrl
              ? '<p class="post-video-link"><a href="' +
                escapeHtml(post.videoLinkUrl) +
                '" target="_blank" rel="noopener noreferrer">Watch on social</a></p>'
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
              videoBlock +
              videoLinkBlock +
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

    var hasLiveTrip =
      liveTrip && liveTrip.city && (liveTrip.status === "live" || liveTrip.status === "planning");
    var liveTabBadge = hasLiveTrip && liveTrip.status === "live";

    var homePanel =
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
      "</div></section>";

    var livePanel =
      liveTripHtml ||
      '<p class="webapp-panel-empty">No live trip right now. Check back when they are on the road.</p>';

    var citiesContent = cityOfTheWeekHtml + cityReviewsHtml + tripRadarHtml;
    var citiesPanel =
      citiesContent ||
      '<p class="webapp-panel-empty">City picks and trip radar will show up here.</p>';

    var postsPanel =
      postsHtml ||
      '<p class="webapp-panel-empty">No posts yet. Follow along for TrekStak tips and trip updates.</p>';

    var publicTabs = [
      { id: "home", label: "Home" },
      { id: "live", label: "Live", badge: liveTabBadge },
      { id: "cities", label: "Cities" },
      { id: "posts", label: "Posts" }
    ];

    var tabButtons =
      window.TrekStakWebApp && TrekStakWebApp.buildTabButtons
        ? TrekStakWebApp.buildTabButtons(publicTabs, "webapp-tab")
        : publicTabs
            .map(function (t) {
              return (
                '<button type="button" class="webapp-tab" data-tab="' +
                t.id +
                '" role="tab">' +
                t.label +
                "</button>"
              );
            })
            .join("");

    var defaultTab = hasLiveTrip && liveTrip.status === "live" ? "live" : "home";

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
      '<div class="webapp-shell">' +
      '<nav class="webapp-tabs" role="tablist" aria-label="Creator page">' +
      tabButtons +
      "</nav>" +
      '<div class="webapp-panels">' +
      '<div class="webapp-panel" data-panel="home" role="tabpanel">' +
      homePanel +
      "</div>" +
      '<div class="webapp-panel" data-panel="live" role="tabpanel" hidden>' +
      livePanel +
      "</div>" +
      '<div class="webapp-panel" data-panel="cities" role="tabpanel" hidden>' +
      citiesPanel +
      "</div>" +
      '<div class="webapp-panel" data-panel="posts" role="tabpanel" hidden>' +
      postsPanel +
      "</div>" +
      "</div></div></article>";

    if (window.TrekStakWebApp && TrekStakWebApp.mountTabPanels) {
      TrekStakWebApp.mountTabPanels({
        root: APP_ROOT.querySelector(".webapp-shell"),
        tabs: publicTabs,
        defaultTab: defaultTab
      });
    }

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
          return Promise.all([mergeCreator(creator), loadCityLookup()]).then(function (results) {
            renderCreator(results[0]);
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
