/**
 * 把整个 app 打成一个 HTML 文件。
 *
 * 产出两份：
 *   dist/petbloom.html           完整文档，双击即可打开、可直接发给别人、可离线用
 *   dist/petbloom-artifact.html  只有页面内容（无 doctype/html/head/body），
 *                                供需要自行包裹骨架的托管环境使用
 *
 * 单文件版没有任何外部请求：CSS 内联、JS 打成一个 IIFE、图标是 data URI。
 * 这也是它不注册 Service Worker 的原因——它本身就已经离线了。
 *
 *   node scripts/build-single-file.js
 */

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

const TITLE = 'PetBloom · 宠物花园';
const DESC = '全物种宠物饲养管理与陪伴：终身档案、精准饮食处方、行为翻译与 5 分钟症状自查。';

async function main() {
  const css = await readFile(join(ROOT, 'styles', 'app.css'), 'utf8');
  const icon = await readFile(join(ROOT, 'icons', 'icon.svg'), 'utf8');

  const bundled = await build({
    entryPoints: [join(ROOT, 'src', 'app.js')],
    bundle: true,
    format: 'iife',
    target: ['es2022'],
    charset: 'utf8',
    write: false,
    legalComments: 'none',
    define: { __PB_SINGLE_FILE__: 'true' },
  });
  const js = bundled.outputFiles[0].text;

  const style = `<style>\n${css}</style>`;
  const markup =
    '<a class="skip-link" href="#app">跳到主要内容</a>\n' +
    '<header id="appbar" class="appbar" hidden></header>\n' +
    '<main id="app" class="app"></main>\n' +
    '<nav id="nav" class="nav" hidden></nav>';
  const script = `<script>\n${js}</script>`;

  // 片段版：宿主环境会补上 doctype / head / body
  const fragment = [`<title>${TITLE}</title>`, style, markup, script, ''].join('\n\n');

  // 完整文档版
  const standalone = `<!doctype html>
<html lang="zh-CN" data-species="meow">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${DESC}" />
    <meta name="theme-color" content="#2E8B57" />
    <title>${TITLE}</title>
    <link rel="icon" href="data:image/svg+xml;utf8,${encodeURIComponent(icon)}" />
    ${style}
  </head>
  <body>
    ${markup}
    ${script}
  </body>
</html>
`;

  await mkdir(DIST, { recursive: true });
  await writeFile(join(DIST, 'petbloom.html'), standalone, 'utf8');
  await writeFile(join(DIST, 'petbloom-artifact.html'), fragment, 'utf8');

  const kb = (s) => `${Math.round(Buffer.byteLength(s, 'utf8') / 1024)} KB`;
  console.log(`dist/petbloom.html          ${kb(standalone)}  完整文档，双击即可用`);
  console.log(`dist/petbloom-artifact.html ${kb(fragment)}  页面片段`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
