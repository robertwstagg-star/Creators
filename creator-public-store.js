(function (global) {
  "use strict";

  var STORAGE_PREFIX = "trekstak-creator-public-";
  var COLLECTION = "creator_pages";
  var firebaseReady = null;

  function storageKey(slug) {
    return STORAGE_PREFIX + String(slug || "").toLowerCase();
  }

  function normalizeSlug(slug) {
    return String(slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
  }

  function readOverlay(slug) {
    try {
      var raw = localStorage.getItem(storageKey(slug));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeOverlay(slug, data) {
    try {
      localStorage.setItem(
        storageKey(slug),
        JSON.stringify(Object.assign({}, data, { updatedAt: new Date().toISOString() }))
      );
    } catch (e) {
      /* ignore */
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureFirebase() {
    if (firebaseReady) return firebaseReady;
    if (!global.TrekStakFirebaseConfig) {
      return Promise.reject(new Error("Firebase config missing"));
    }

    firebaseReady = loadScript(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
    )
      .then(function () {
        return loadScript(
          "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"
        );
      })
      .then(function () {
        return loadScript(
          "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"
        );
      })
      .then(function () {
        if (!firebase.apps.length) {
          firebase.initializeApp(global.TrekStakFirebaseConfig);
        }
        return firebase.auth().signInAnonymously();
      })
      .then(function () {
        return { firestore: firebase.firestore() };
      });

    return firebaseReady;
  }

  function applyOverlay(creator, overlay) {
    if (!creator) return creator;
    if (!overlay) return creator;
    return Object.assign({}, creator, {
      bio: overlay.bio != null ? overlay.bio : creator.bio,
      avatarUrl: overlay.avatarUrl != null ? overlay.avatarUrl : creator.avatarUrl,
      socials: Object.assign({}, creator.socials || {}, overlay.socials || {}),
      posts: Array.isArray(overlay.posts) ? overlay.posts.slice() : creator.posts
    });
  }

  function mergePublicFields(creator) {
    return applyOverlay(creator, readOverlay(creator && creator.slug));
  }

  function fetchRemoteOverlay(slug) {
    var safeSlug = normalizeSlug(slug);
    if (!safeSlug) return Promise.resolve(null);

    return ensureFirebase()
      .then(function (fb) {
        return fb.firestore.collection(COLLECTION).doc(safeSlug).get();
      })
      .then(function (snap) {
        if (!snap.exists) return null;
        var data = snap.data() || {};
        var overlay = {
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          socials: Object.assign(
            { instagram: "", tiktok: "", youtube: "" },
            data.socials || {}
          ),
          posts: Array.isArray(data.posts) ? data.posts.slice() : []
        };
        writeOverlay(safeSlug, overlay);
        return overlay;
      })
      .catch(function (err) {
        console.warn("Creator page remote read failed", err);
        return readOverlay(safeSlug);
      });
  }

  function mergePublicFieldsAsync(creator) {
    if (!creator) return Promise.resolve(creator);
    return fetchRemoteOverlay(creator.slug).then(function (overlay) {
      return applyOverlay(creator, overlay || readOverlay(creator.slug));
    });
  }

  global.CreatorPublicStore = {
    readOverlay: readOverlay,
    mergePublicFields: mergePublicFields,
    mergePublicFieldsAsync: mergePublicFieldsAsync,
    fetchRemoteOverlay: fetchRemoteOverlay,
    storageKey: storageKey
  };
})(typeof window !== "undefined" ? window : globalThis);
