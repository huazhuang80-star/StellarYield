/** 极简 UI 工具：模板拼接 + 转义，不引入任何框架依赖。 */

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 标记一段字符串为"已经是安全 HTML"，避免二次转义。 */
export function raw(html) {
  return { __html: String(html) };
}

/** 标签模板：自动转义插值，raw() 与数组会被展开。 */
export function h(strings, ...values) {
  return strings.reduce((out, str, i) => {
    if (i === 0) return str;
    const v = values[i - 1];
    return out + serialize(v) + str;
  }, '');
}

function serialize(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(serialize).join('');
  if (typeof v === 'object' && '__html' in v) return v.__html;
  return esc(v);
}

export function card(title, bodyHtml, opts = {}) {
  const { tone = '', action = '', icon = '' } = opts;
  return h`<section class="card ${raw(tone ? 'tone-' + tone : '')}">
    ${title ? raw(`<header class="card-head"><h3>${icon ? esc(icon) + ' ' : ''}${esc(title)}</h3>${action}</header>`) : ''}
    <div class="card-body">${raw(bodyHtml)}</div>
  </section>`;
}

export function pill(text, tone = 'neutral') {
  return h`<span class="pill tone-${tone}">${text}</span>`;
}

export function emptyState(text, cta = '') {
  return h`<div class="empty"><p>${text}</p>${raw(cta)}</div>`;
}

/** 简易折线图（内联 SVG，无依赖）。 */
export function sparkline(points, { width = 300, height = 90, band = null } = {}) {
  if (!points.length) return '<p class="muted">还没有数据</p>';
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.kg);
  const minY = Math.min(...ys, band ? band.min : Infinity) * 0.95;
  const maxY = Math.max(...ys, band ? band.max : -Infinity) * 1.05;
  const spanY = maxY - minY || 1;
  const px = (i) => (xs.length === 1 ? width / 2 : (i / (xs.length - 1)) * (width - 24) + 12);
  const py = (v) => height - 12 - ((v - minY) / spanY) * (height - 24);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.kg).toFixed(1)}`).join(' ');
  const bandRect = band
    ? `<rect x="0" y="${py(band.max).toFixed(1)}" width="${width}" height="${Math.max(1, py(band.min) - py(band.max)).toFixed(1)}" class="chart-band"/>`
    : '';
  const dots = points.map((p, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(p.kg).toFixed(1)}" r="3" class="chart-dot"/>`).join('');

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="体重曲线">
    ${bandRect}<path d="${path}" class="chart-line" fill="none"/>${dots}
  </svg>`;
}

/** 数值输入行。 */
export function field(label, inputHtml, hint = '') {
  return h`<label class="field"><span class="field-label">${label}</span>${raw(inputHtml)}${hint ? raw(`<small class="muted">${esc(hint)}</small>`) : ''}</label>`;
}

export function select(name, options, current) {
  const opts = options
    .map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(current) ? ' selected' : ''}>${esc(o.t)}</option>`)
    .join('');
  return `<select name="${esc(name)}">${opts}</select>`;
}

export function num(name, value, { step = '0.1', min = '0', placeholder = '' } = {}) {
  return `<input type="number" name="${esc(name)}" value="${value ?? ''}" step="${step}" min="${min}" placeholder="${esc(placeholder)}" inputmode="decimal">`;
}

export function text(name, value, placeholder = '') {
  return `<input type="text" name="${esc(name)}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}">`;
}
