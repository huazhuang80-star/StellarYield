/** 设置：外观、提醒提前量、宠物管理、数据备份与恢复。 */

import { h, raw, esc, card, field, select, num, toast, confirmDialog } from '../ui.js';
import * as store from '../lib/store.js';
import { SPECIES } from '../data/species.js';
import { APP } from '../data/meta.js';

export default {
  id: 'settings',
  title: '设置',

  render(ctx) {
    const s = store.load();
    const st = s.settings;

    return h`
      <h1 class="page-title">⚙️ 设置</h1>

      ${raw(
        card(
          '外观',
          `${field('主题', select('theme', [{ v: 'auto', t: '跟随系统' }, { v: 'light', t: '始终浅色' }, { v: 'dark', t: '始终深色' }], st.theme ?? 'auto'))}
           ${field('字号', select('fontScale', [{ v: '0.95', t: '紧凑' }, { v: '1', t: '标准' }, { v: '1.1', t: '大' }, { v: '1.2', t: '更大' }], String(st.fontScale ?? 1)), '给需要放大看的家人用')}
           <button class="btn primary" id="save-appearance">应用</button>`,
          { icon: '🎨' },
        ),
      )}

      ${raw(
        card(
          '提醒',
          `${field('提前多少天开始提示', num('lead', st.remindLeadDays ?? 7, { step: '1' }), '疫苗、驱虫、体检到期前的提前量')}
           <button class="btn primary" id="save-remind">保存</button>
           <p class="muted">离线版本没有后台服务，不会推送系统通知。重要事项建议同时加进手机日历。</p>`,
          { icon: '⏰' },
        ),
      )}

      ${raw(
        card(
          `我的宠物（${s.pets.length}）`,
          `<ul class="pet-list">${s.pets
            .map(
              (p) => `<li class="${p.id === ctx.pet.id ? 'active' : ''}">
                <button class="btn small" data-switch="${esc(p.id)}">${esc(SPECIES[p.species]?.emoji ?? '🐾')} ${esc(p.name)}</button>
                <small class="muted">${esc(SPECIES[p.species]?.name ?? '')}${p.breed ? ' · ' + esc(p.breed) : ''}</small>
                ${s.pets.length > 1 ? `<button class="btn small ghost" data-remove="${esc(p.id)}">删除</button>` : ''}
              </li>`,
            )
            .join('')}</ul>
           <button class="btn" id="add-pet">+ 添加一只宠物</button>`,
          { icon: '🐾' },
        ),
      )}

      ${raw(
        card(
          '数据备份',
          `<p class="muted">所有记录只存在这台设备的浏览器里。清除浏览器数据、卸载或换设备都会丢失，请定期导出。</p>
           <div class="btn-row">
             <button class="btn primary" id="export">导出 JSON 备份</button>
             <label class="btn ghost file-btn">导入备份<input type="file" id="import" accept="application/json" hidden></label>
           </div>
           <p class="muted">导入会<b>覆盖</b>当前全部数据，导入前建议先导出一份。</p>`,
          { icon: '💾' },
        ),
      )}

      ${raw(
        card(
          '危险操作',
          `<button class="btn danger" id="wipe">清除全部数据</button>
           <p class="muted">删除所有宠物档案、记录、用药、花费与自查历史，无法恢复。</p>`,
          { icon: '⚠️', tone: 'danger' },
        ),
      )}

      ${raw(
        card(
          '关于',
          `<p>${esc(APP.name)} · ${esc(APP.cnName)} v${esc(APP.version)}</p>
           <div class="btn-row">
             <a class="btn ghost" href="#about">关于与内容来源</a>
             <a class="btn ghost" href="#help">帮助与常见问题</a>
           </div>`,
          { icon: 'ℹ️' },
        ),
      )}
    `;
  },

  bind(root, ctx) {
    root.querySelector('#save-appearance')?.addEventListener('click', () => {
      store.updateSettings({
        theme: root.querySelector('[name="theme"]').value,
        fontScale: Number(root.querySelector('[name="fontScale"]').value) || 1,
      });
      toast('外观已更新');
      ctx.refresh();
    });

    root.querySelector('#save-remind')?.addEventListener('click', () => {
      const lead = Math.max(0, Math.min(60, Number(root.querySelector('[name="lead"]').value) || 7));
      store.updateSettings({ remindLeadDays: lead });
      toast(`提前 ${lead} 天提示`);
      ctx.refresh();
    });

    root.querySelectorAll('button[data-switch]').forEach((b) =>
      b.addEventListener('click', () => {
        store.setActivePet(b.dataset.switch);
        ctx.navigate('home');
      }),
    );

    root.querySelectorAll('button[data-remove]').forEach((b) =>
      b.addEventListener('click', async () => {
        const pet = store.load().pets.find((p) => p.id === b.dataset.remove);
        const ok = await confirmDialog({
          title: `删除「${pet?.name ?? '这只宠物'}」的全部档案？`,
          body: '包括所有记录、用药、就诊、花费与自查历史。此操作无法撤销，建议先导出备份。',
          confirmText: '仍然删除',
          danger: true,
        });
        if (!ok) return;
        store.removePet(b.dataset.remove);
        toast('已删除', 'warn');
        ctx.refresh();
      }),
    );

    root.querySelector('#add-pet')?.addEventListener('click', () => ctx.navigate('onboarding'));

    root.querySelector('#export')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(store.load(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `petbloom-${store.today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('已导出，请妥善保存');
    });

    root.querySelector('#import')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ok = await confirmDialog({
        title: '导入会覆盖当前全部数据',
        body: '当前设备上的所有记录将被备份文件替换。确定继续吗？',
        confirmText: '覆盖导入',
        danger: true,
      });
      if (!ok) {
        e.target.value = '';
        return;
      }
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || !Array.isArray(parsed.pets)) throw new Error('格式不对');
        store.replaceAll(parsed);
        toast('导入成功');
        ctx.navigate('home');
      } catch {
        toast('导入失败：这个文件不是 PetBloom 的备份', 'danger');
      }
      e.target.value = '';
    });

    root.querySelector('#wipe')?.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '清除全部数据？',
        body: '所有宠物的档案与记录都会被删除，无法恢复。建议先导出备份。',
        confirmText: '全部清除',
        danger: true,
      });
      if (!ok) return;
      store.reset();
      ctx.navigate('onboarding');
    });
  },
};
