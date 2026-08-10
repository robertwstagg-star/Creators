(function (global) {
  "use strict";

  var STORAGE_PREFIX = "trekstak-creator-public-";

  function storageKey(slug) {
    return STORAGE_PREFIX + String(slug || "").toLowerCase();
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

  function mergePublicFields(creator) {
    if (!creator) return creator;
    var overlay = readOverlay(creator.slug);
    if (!overlay) return creator;
    return Object.assign({}, creator, {
      bio: overlay.bio != null ? overlay.bio : creator.bio,
      avatarUrl: overlay.avatarUrl != null ? overlay.avatarUrl : creator.avatarUrl,
      socials: Object.assign({}, creator.socials || {}, overlay.socials || {}),
      posts: Array.isArray(overlay.posts) ? overlay.posts.slice() : creator.posts
    });
  }

  global.CreatorPublicStore = {
    readOverlay: readOverlay,
    mergePublicFields: mergePublicFields,
    storageKey: storageKey
  };
})(typeof window !== "undefined" ? window : globalThis);
