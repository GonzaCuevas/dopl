// ——— Taobao 1688 API (RapidAPI — chuyenhangsieutocvn)
// Docs: https://rapidapi.com/chuyenhangsieutocvn/api/taobao-1688-api1
// If an endpoint path differs in the API docs, change it in endpoints below.
var TAOBAO_1688 = {
  host: 'taobao-1688-api1.p.rapidapi.com',
  key: '32331e430amsh5ed5391aed20b6fp1a11ffjsn67fbae04bd1c',
  base: 'https://taobao-1688-api1.p.rapidapi.com',
  endpoints: {
    searchKeyword: '/1688/search-keyword',
    productDetailById: '/1688/product-detail',
    productDetailByUrl: '/1688/product-by-url',
    searchByImage: '/1688/search-image'
  }
};

// ——— Taobao DataHub API (RapidAPI — ecommdatahub)
// Docs: https://rapidapi.com/ecommdatahub/api/taobao-datahub
var TAOBAO_DATAHUB = {
  host: 'taobao-datahub.p.rapidapi.com',
  key: '32331e430amsh5ed5391aed20b6fp1a11ffjsn67fbae04bd1c',
  base: 'https://taobao-datahub.p.rapidapi.com',
  endpoints: {
    search: '/search',
    searchProducts: '/products/search',
    products: '/products'
  }
};

// ——— API 1688 (RapidAPI): convertir URL de imagen (otro proveedor)
var API_1688 = {
  convertImageUrl: 'https://1688-product2.p.rapidapi.com/1688/tools/image/convert_url',
  host: '1688-product2.p.rapidapi.com',
  key: '32331e430amsh5ed5391aed20b6fp1a11ffjsn67fbae04bd1c'
};

// ——— DOM ———
const searchForms = document.querySelectorAll('form[role="search"], .search-box');
const resultsSection = document.getElementById('search-results');
const resultsGrid = document.getElementById('results-grid');
const resultsMeta = document.getElementById('results-meta');
const resultsLoading = document.getElementById('results-loading');
const resultsError = document.getElementById('results-error');
const resultsErrorMsg = document.getElementById('results-error-msg');

// ——— Search ———
function showLoading() {
  if (!resultsSection) return;
  resultsSection.hidden = false;
  resultsGrid.innerHTML = '';
  resultsMeta.textContent = '';
  if (resultsLoading) resultsLoading.hidden = false;
  if (resultsError) resultsError.hidden = true;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
  if (resultsLoading) resultsLoading.hidden = true;
  if (resultsError) {
    resultsError.hidden = false;
    if (resultsErrorMsg) resultsErrorMsg.textContent = message;
  }
  if (resultsGrid) resultsGrid.innerHTML = '';
  if (resultsMeta) resultsMeta.textContent = '';
}

function showResults(data, query) {
  if (resultsLoading) resultsLoading.hidden = true;
  if (resultsError) resultsError.hidden = true;

  var items = data._items ? data._items : normalizeItems(data);
  var total = data.total != null ? data.total : items.length;

  if (resultsMeta) {
    resultsMeta.textContent = items.length > 0
      ? total + ' result' + (total !== 1 ? 's' : '') + ' for “‘ + escapeHtml(query) + '"'
      : 'No results for “‘ + escapeHtml(query) + '”. Try another keyword.';
  }

  if (!resultsGrid) return;
  resultsGrid.innerHTML = '';

  if (items.length === 0) {
    resultsGrid.innerHTML = '<p class="results-empty">No products found. Try another keyword (e.g. shoes, bag, phone) or check spelling.</p>';
    return;
  }

  items.forEach(function (item) {
    const card = document.createElement('a');
    card.href = item.url || '#';
    if (item.url) card.target = '_blank';
    card.rel = 'noopener';
    card.className = 'product-card';
    card.innerHTML =
      '<div class="product-card__img">' +
        (item.image ? '<img src="' + escapeAttr(item.image) + '" alt="" loading="lazy">' : '<span class="product-card__no-img">No image</span>') +
      '</div>' +
      '<div class="product-card__body">' +
        '<h3 class="product-card__title">' + escapeHtml(item.title || 'Product') + '</h3>' +
        (item.price != null ? '<p class="product-card__price">¥ ' + escapeHtml(String(item.price)) + '</p>' : '') +
      '</div>';
    resultsGrid.appendChild(card);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mapProduct(x) {
  if (typeof x !== 'object' || x === null) return { title: String(x), url: '', image: '', price: null };
  var url = x.url || x.link || x.item_url || x.detail_url || x.product_url || x.goods_url || '';
  if (!url && (x.goods_id || x.item_id || x.product_id)) {
    var id = x.goods_id || x.item_id || x.product_id;
    url = 'https://detail.1688.com/offer/' + id + '.html';
  }
  return {
    title: x.title || x.name || x.item_title || x.subject || x.goods_name || '',
    url: url,
    image: x.pic_url || x.pict_url || x.image || x.img || x.thumb || x.goods_img || (x.images && x.images[0]) || '',
    price: x.price != null ? x.price : (x.current_price || x.reserve_price || x.min_price || x.retail_price)
  };
}

function normalizeItems(data) {
  if (!data || typeof data !== 'object') return [];

  // Lista directa en la raíz
  var list = data.data || data.list || data.items || data.products || data.goods;
  if (Array.isArray(list)) return list.map(mapProduct);

  // Anidado en result
  var result = data.result;
  if (result && typeof result === 'object') {
    var rlist = result.data || result.list || result.items || result.item || result.goods;
    if (Array.isArray(rlist)) return rlist.map(mapProduct);
    if (Array.isArray(result)) return result.map(mapProduct);
    if (result.shop_list && Array.isArray(result.shop_list)) {
      return result.shop_list.map(function (s) {
        return {
          title: s.title || s.shop_name || s.name || '',
          url: s.url || s.shop_url || '',
          image: s.pic_url || s.logo || s.image || '',
          price: s.price || null
        };
      });
    }
  }

  // body.result (algunas APIs envuelven en body)
  if (data.body && data.body.result) {
    var blist = data.body.result;
    if (Array.isArray(blist)) return blist.map(mapProduct);
    if (blist.list && Array.isArray(blist.list)) return blist.list.map(mapProduct);
    if (blist.data && Array.isArray(blist.data)) return blist.data.map(mapProduct);
  }

  // Búsqueda profunda: cualquier array de objetos que parezcan productos
  var found = findProductArray(data);
  if (found.length) return found.map(mapProduct);

  return [];
}

function findProductArray(obj, depth) {
  depth = depth || 0;
  if (depth > 5) return [];
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) {
    var first = obj[0];
    if (obj.length > 0 && typeof first === 'object' && first !== null) {
      var hasProductField = first.title || first.name || first.item_title || first.subject || first.pic_url || first.price;
      if (hasProductField) return obj;
    }
    return [];
  }
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var val = obj[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        var sample = val[0];
        if (sample.title || sample.name || sample.item_title || sample.subject || sample.pic_url || sample.goods_id) {
          return val;
        }
      }
      var nested = findProductArray(val, depth + 1);
      if (nested.length) return nested;
    }
  }
  return [];
}

function tryDataHubSearch(query) {
  var endpoints = [
    TAOBAO_DATAHUB.base + TAOBAO_DATAHUB.endpoints.search + '?q=' + encodeURIComponent(query),
    TAOBAO_DATAHUB.base + TAOBAO_DATAHUB.endpoints.search + '?keyword=' + encodeURIComponent(query),
    TAOBAO_DATAHUB.base + TAOBAO_DATAHUB.endpoints.searchProducts + '?q=' + encodeURIComponent(query),
    TAOBAO_DATAHUB.base + TAOBAO_DATAHUB.endpoints.products + '?q=' + encodeURIComponent(query)
  ];
  var headers = {
    'x-rapidapi-host': TAOBAO_DATAHUB.host,
    'x-rapidapi-key': TAOBAO_DATAHUB.key
  };
  function tryNext(i) {
    if (i >= endpoints.length) return Promise.resolve(null);
    return fetch(endpoints[i], { method: 'GET', headers: headers })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (out) {
        if (!out.ok || (out.data && (out.data.message || out.data.error))) return tryNext(i + 1);
        var items = normalizeItems(out.data);
        if (items.length > 0) {
          var total = (out.data && out.data.total != null) ? out.data.total : items.length;
          return { _items: items, total: total };
        }
        return tryNext(i + 1);
      })
      .catch(function () { return tryNext(i + 1); });
  }
  return tryNext(0);
}

function runSearch(query) {
  query = (query || '').trim();
  if (!query) return;

  showLoading();

  var url1688 = TAOBAO_1688.base + TAOBAO_1688.endpoints.searchKeyword + '?keyword=' + encodeURIComponent(query) + '&page=1';
  fetch(url1688, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': TAOBAO_1688.host,
      'x-rapidapi-key': TAOBAO_1688.key
    }
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
    .then(function (out) {
      var d = out.data;
      if (d && (d.message || d.error)) {
        return tryDataHubSearch(query).then(function (datahub) {
          if (datahub) showResults(datahub, query);
          else showError(d.message || d.error || 'API error');
        });
      }
      if (out.ok) {
        var items = normalizeItems(d);
        if (items.length > 0) {
          var total = (d && d.total != null) ? d.total : (d && d.data && d.data.total != null ? d.data.total : items.length);
          showResults({ _items: items, total: total }, query);
          return;
        }
        return tryDataHubSearch(query).then(function (datahub) {
          if (datahub) showResults(datahub, query);
          else {
            var total = (d && d.total != null) ? d.total : 0;
            showResults({ _items: [], total: total }, query);
          }
        });
      }
      return tryDataHubSearch(query).then(function (datahub) {
        if (datahub) showResults(datahub, query);
        else showError(d && (d.message || d.error) || 'Error ' + (out.status || ''));
      });
    })
    .catch(function (err) {
      tryDataHubSearch(query).then(function (datahub) {
        if (datahub) showResults(datahub, query);
        else {
          var msg = err.message || 'Search failed.';
          if (msg.indexOf('Failed to fetch') !== -1 || err.name === 'TypeError') {
            msg = 'No se pudo conectar. Ejecuta la p\u00E1gina desde un servidor (npx serve) o sube a Vercel.';
          }
          showError(msg);
        }
      });
    });
}

searchForms.forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input[name="q"], .search-input');
    var query = input ? input.value : '';
    runSearch(query);
  });
});

// ——— 1688 API: Product detail by ID ———
var productDetailResultEl = document.getElementById('product-detail-result');
var productIdInput = document.getElementById('product-id-input');
var productDetailIdBtn = document.getElementById('product-detail-id-btn');
var productUrlInput = document.getElementById('product-url-input');
var productDetailUrlBtn = document.getElementById('product-detail-url-btn');

function call1688(path, params, method) {
  method = method || 'GET';
  var url = TAOBAO_1688.base + path;
  if (method === 'GET' && params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    url += (path.indexOf('?') >= 0 ? '&' : '?') + q;
  }
  var opts = {
    method: method,
    headers: { 'x-rapidapi-host': TAOBAO_1688.host, 'x-rapidapi-key': TAOBAO_1688.key }
  };
  if (method === 'POST' && params) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(params);
  }
  return fetch(url, opts).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); });
}

function showProductDetail(data) {
  if (!productDetailResultEl) return;
  productDetailResultEl.hidden = false;
  var d = data.data || data.result || data;
  var title = d.title || d.subject || d.name || '';
  var price = d.price != null ? d.price : (d.min_price || d.current_price);
  var img = d.pic_url || d.image || d.img || (d.images && d.images[0]);
  var url = d.url || d.detail_url || d.link || d.product_url || '';
  var html = '';
  if (title || price != null || img || url) {
    html = '<div class="detail-card">';
    if (img) html += '<div class="detail-card__img"><img src="' + escapeAttr(img) + '" alt=""></div>';
    html += '<div class="detail-card__body">';
    if (title) html += '<h3 class="detail-card__title">' + escapeHtml(title) + '</h3>';
    if (price != null) html += '<p class="detail-card__price">¥ ' + escapeHtml(String(price)) + '</p>';
    if (url) html += '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" class="detail-card__link">Open on 1688</a>';
    html += '</div></div>';
  } else {
    html = '<pre class="detail-raw">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
  }
  productDetailResultEl.innerHTML = html;
}

if (productDetailIdBtn && productIdInput) {
  productDetailIdBtn.addEventListener('click', function () {
    var id = (productIdInput.value || '').trim();
    if (!id) {
      if (productDetailResultEl) { productDetailResultEl.hidden = false; productDetailResultEl.innerHTML = '<p class="convert-error">Enter a product ID.</p>'; }
      return;
    }
    productDetailResultEl.hidden = false;
    productDetailResultEl.innerHTML = '<p class="convert-loading">Loading…</p>';
    call1688(TAOBAO_1688.endpoints.productDetailById + '?item_id=' + encodeURIComponent(id))
      .then(function (out) {
        if (out.ok) showProductDetail(out.data);
        else productDetailResultEl.innerHTML = '<p class="convert-error">' + escapeHtml((out.data && (out.data.message || out.data.error)) || 'Request failed') + '</p>';
      })
      .catch(function (err) {
        productDetailResultEl.innerHTML = '<p class="convert-error">' + escapeHtml(err.message || 'Failed') + '</p>';
      });
  });
}

if (productDetailUrlBtn && productUrlInput) {
  productDetailUrlBtn.addEventListener('click', function () {
    var url = (productUrlInput.value || '').trim();
    if (!url) {
      if (productDetailResultEl) { productDetailResultEl.hidden = false; productDetailResultEl.innerHTML = '<p class="convert-error">Enter a product URL.</p>'; }
      return;
    }
    productDetailResultEl.hidden = false;
    productDetailResultEl.innerHTML = '<p class="convert-loading">Loading…</p>';
    call1688(TAOBAO_1688.endpoints.productDetailByUrl + '?url=' + encodeURIComponent(url))
      .then(function (out) {
        if (out.ok) showProductDetail(out.data);
        else productDetailResultEl.innerHTML = '<p class="convert-error">' + escapeHtml((out.data && (out.data.message || out.data.error)) || 'Request failed') + '</p>';
      })
      .catch(function (err) {
        productDetailResultEl.innerHTML = '<p class="convert-error">' + escapeHtml(err.message || 'Failed') + '</p>';
      });
  });
}

// ——— 1688: Convert image URL ———
var convertResultEl = document.getElementById('convert-result');
var convertBtn = document.getElementById('convert-image-btn');
var imageUrlInput = document.getElementById('image-url-input');

if (convertBtn && imageUrlInput) {
  convertBtn.addEventListener('click', function () {
    var url = (imageUrlInput.value || '').trim();
    if (!url) {
      if (convertResultEl) {
        convertResultEl.hidden = false;
        convertResultEl.innerHTML = '<p class="convert-error">Pega una URL de imagen.</p>';
      }
      return;
    }

    convertResultEl.hidden = false;
    convertResultEl.innerHTML = '<p class="convert-loading">Converting…</p>';

    fetch(API_1688.convertImageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': API_1688.host,
        'x-rapidapi-key': API_1688.key
      },
      body: JSON.stringify({ url: url })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
          return data;
        });
      })
      .then(function (data) {
        var converted = data.data?.url || data.url || data.converted_url || data.result;
        if (converted) {
          convertResultEl.innerHTML =
            '<p class="convert-label">Converted URL (1688):</p>' +
            '<p class="convert-url"><a href="' + escapeAttr(converted) + '" target="_blank" rel="noopener">' + escapeHtml(converted) + '</a></p>' +
            '<button type="button" class="btn-copy" data-copy="' + escapeAttr(converted) + '">Copy</button>';
          var copyBtn = convertResultEl.querySelector('.btn-copy');
          if (copyBtn) {
            copyBtn.addEventListener('click', function () {
              navigator.clipboard.writeText(converted).then(function () {
                copyBtn.textContent = 'Copied!';
                setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
              });
            });
          }
        } else {
          convertResultEl.innerHTML = '<p class="convert-label">Response:</p><pre>' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
        }
      })
      .catch(function (err) {
        convertResultEl.innerHTML = '<p class="convert-error">' + escapeHtml(err.message || 'Conversion failed.') + '</p>';
      });
  });
}
