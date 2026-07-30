s=open('index.html').read()
v=open('viewer.js').read()
MARK='   西宁自建房 · 实时渲染与日照模拟'
i=s.index(MARK)
start=s.rindex('<script>', 0, i)
end=s.index('</script>', i)+len('</script>')
s=s[:start]+'<script>\n'+v.rstrip()+'\n</script>'+s[end:]
open('index.html','w').write(s)
print('spliced', len(v), 'bytes -> page', len(s))
