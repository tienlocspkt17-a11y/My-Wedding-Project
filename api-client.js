(function () {
  'use strict';

  var API_TIMEOUT = 9000;
  var OUTBOX_KEY = 'wedding-wish-outbox-v1';
  var configPromise = null;
  var turnstileScriptPromise = null;
  var turnstileWidgets = new Map();

  function apiError(message, status, code) {
    var error = new Error(message || 'Không thể kết nối tới máy chủ.');
    error.status = Number(status) || 0;
    error.code = code || 'network_error';
    return error;
  }

  async function request(path, options) {
    var requestOptions = Object.assign({}, options || {});
    var controller = new AbortController();
    var timeoutMs = Math.max(API_TIMEOUT, Number(requestOptions.timeout) || API_TIMEOUT);
    delete requestOptions.timeout;
    var timeout = setTimeout(function () { controller.abort(); }, timeoutMs);
    try {
      var response = await fetch(path, Object.assign({
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }, requestOptions));
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok || payload.ok === false) {
        throw apiError(payload.error || 'Yêu cầu không thành công.', response.status, payload.code);
      }
      return payload;
    } catch (error) {
      if (error?.status) throw error;
      if (error?.name === 'AbortError') throw apiError('Kết nối quá chậm. Vui lòng thử lại.', 0, 'timeout');
      throw apiError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.', 0, 'network_error');
    } finally {
      clearTimeout(timeout);
    }
  }

  function requestId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'wish_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  }

  function listWishes(limit) {
    return request('/api/wishes?limit=' + encodeURIComponent(limit || 40));
  }

  function submitWish(wish) {
    return request('/api/wishes', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ clientRequestId: requestId() }, wish)),
    });
  }

  function listSongSuggestions(limit) {
    return request('/api/song-suggestions?limit=' + encodeURIComponent(limit || 12));
  }

  function submitSongSuggestion(suggestion) {
    return request('/api/song-suggestions', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ clientRequestId: requestId() }, suggestion)),
    });
  }

  function listPhotos(context, limit) {
    return request('/api/photos?context=' + encodeURIComponent(context || 'story') + '&limit=' + encodeURIComponent(limit || 16));
  }

  function submitPhoto(photo, file) {
    var form = new FormData();
    Object.keys(photo || {}).forEach(function (key) {
      if (photo[key] !== undefined && photo[key] !== null) form.append(key, String(photo[key]));
    });
    if (!form.has('clientRequestId')) form.append('clientRequestId', requestId());
    var extension = file?.type === 'image/webp' ? 'webp' : file?.type === 'image/png' ? 'png' : 'jpg';
    form.append('photo', file, file?.name || 'wedding-photo.' + extension);
    return request('/api/photos', { method: 'POST', body: form, timeout: 45000 });
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob || null); }, type, quality);
    });
  }

  async function compressPhoto(file, options) {
    options = options || {};
    var maxInputBytes = Math.max(1_000_000, Number(options.maxInputBytes) || 40_000_000);
    var maxOutputBytes = Math.max(200_000, Number(options.maxOutputBytes) || 1_200_000);
    var maxEdge = Math.max(640, Math.min(1920, Number(options.maxEdge) || 1440));
    if (!file) return null;
    var looksLikeImage = String(file.type || '').startsWith('image/') || /\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name || '');
    if (!looksLikeImage || !file.size || file.size > maxInputBytes) return null;

    var image = new Image();
    image.decoding = 'async';
    var objectUrl = URL.createObjectURL(file);
    try {
      await new Promise(function (resolve, reject) {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      });
      if (!image.naturalWidth || !image.naturalHeight) return null;

      async function encodeAt(edge, quality) {
        var scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        var context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        var blob = await canvasBlob(canvas, 'image/webp', quality);
        if (!blob || blob.type !== 'image/webp') blob = await canvasBlob(canvas, 'image/jpeg', Math.min(.86, quality));
        canvas.width = 1;
        canvas.height = 1;
        return blob;
      }

      var output = await encodeAt(maxEdge, .82);
      if (output && output.size > maxOutputBytes) output = await encodeAt(Math.round(maxEdge * .82), .68);
      if (output && output.size > maxOutputBytes) output = await encodeAt(Math.round(maxEdge * .68), .58);
      return output && output.size <= maxOutputBytes ? output : null;
    } catch (_) {
      return null;
    } finally {
      URL.revokeObjectURL(objectUrl);
      image.removeAttribute('src');
    }
  }

  function invitationSlug() {
    var match = location.pathname.match(/^\/invite\/([^/]+)\/?$/i);
    if (match) return decodeURIComponent(match[1]);
    return new URLSearchParams(location.search).get('guest') || '';
  }

  function getInvitation(slug) {
    return request('/api/invitations/' + encodeURIComponent(slug));
  }

  function loadOutbox() {
    try {
      var parsed = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
    } catch (_) {
      return [];
    }
  }

  function saveOutbox(items) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-12))); } catch (_) {}
  }

  function queueWish(wish) {
    var item = Object.assign({}, wish);
    delete item.turnstileToken;
    if (!item.clientRequestId) item.clientRequestId = requestId();
    var outbox = loadOutbox();
    if (!outbox.some(function (existing) { return existing.clientRequestId === item.clientRequestId; })) outbox.push(item);
    saveOutbox(outbox);
    return item;
  }

  async function flushWishOutbox() {
    var pending = loadOutbox();
    if (!pending.length) return [];
    var synced = [];
    var remaining = [];
    for (var index = 0; index < pending.length; index += 1) {
      var item = pending[index];
      try {
        var response = await submitWish(item);
        if (response.wish) synced.push(response.wish);
      } catch (error) {
        // Lỗi validation/authorization sẽ không tự hết; bỏ item để tránh retry vô hạn.
        if (error.status >= 400 && error.status < 500) continue;
        remaining.push(item);
        remaining.push.apply(remaining, pending.slice(index + 1));
        break;
      }
    }
    saveOutbox(remaining);
    return synced;
  }

  function getConfig() {
    if (!configPromise) configPromise = request('/api/config').catch(function () { return { ok: false, turnstileSiteKey: '' }; });
    return configPromise;
  }

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = function () { resolve(window.turnstile); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return turnstileScriptPromise;
  }

  async function mountTurnstile(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (turnstileWidgets.has(containerId)) {
      container.hidden = false;
      return turnstileWidgets.get(containerId);
    }
    var config = await getConfig();
    if (!config.turnstileSiteKey) return;
    var turnstile = await loadTurnstileScript();
    if (!turnstile) return;
    container.hidden = false;
    var widgetId = turnstile.render(container, {
      sitekey: config.turnstileSiteKey,
      theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
      size: 'flexible',
      callback: function (token) {
        container.dispatchEvent(new CustomEvent('wedding:turnstile-ready', { detail: { token: token } }));
      },
      'expired-callback': function () {
        container.dispatchEvent(new CustomEvent('wedding:turnstile-expired'));
      },
      'error-callback': function () {
        container.dispatchEvent(new CustomEvent('wedding:turnstile-error'));
      },
    });
    turnstileWidgets.set(containerId, widgetId);
    return widgetId;
  }

  function turnstileToken(containerId) {
    var widgetId = turnstileWidgets.get(containerId);
    return widgetId === undefined || !window.turnstile ? '' : window.turnstile.getResponse(widgetId);
  }

  function resetTurnstile(containerId) {
    var widgetId = turnstileWidgets.get(containerId);
    if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
  }

  window.WeddingAPI = {
    getConfig: getConfig,
    listWishes: listWishes,
    submitWish: submitWish,
    listSongSuggestions: listSongSuggestions,
    submitSongSuggestion: submitSongSuggestion,
    listPhotos: listPhotos,
    submitPhoto: submitPhoto,
    compressPhoto: compressPhoto,
    getInvitation: getInvitation,
    invitationSlug: invitationSlug,
    queueWish: queueWish,
    flushWishOutbox: flushWishOutbox,
    mountTurnstile: mountTurnstile,
    turnstileToken: turnstileToken,
    resetTurnstile: resetTurnstile,
    requestId: requestId,
  };
})();
