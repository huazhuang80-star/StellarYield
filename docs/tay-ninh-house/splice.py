"""构建步骤：geom.js → viewer.js → index.html（内联，页面零外部请求）。"""
GEOM_HEAD = '/* ───────────────────────── 4. 尺寸定义 ─────────────────────────'
GEOM_TAIL = '/* ───────────────────────── 20. 上传缓冲 ───────────────────────── */'

v = open('viewer.js').read()
g = open('geom.js').read()
a = v.index(GEOM_HEAD)
b = v.index(GEOM_TAIL)
v = v[:a] + g.rstrip() + '\n\n' + v[b:]
open('viewer.js', 'w').write(v)
print('geom.js -> viewer.js', len(g), 'bytes')

s = open('index.html').read()
MARK = '   西宁自建房 · 实时渲染与日照模拟'
i = s.index(MARK)
start = s.rindex('<script>', 0, i)
end = s.index('</script>', i) + len('</script>')
s = s[:start] + '<script>\n' + v.rstrip() + '\n</script>' + s[end:]
open('index.html', 'w').write(s)
print('spliced', len(v), 'bytes -> page', len(s))
