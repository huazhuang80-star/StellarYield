/**
 * 预测干预层（四级干预的 Level 1）：在异常变成急症之前先说话。
 *
 * 数据来源全部是用户自己记录的日常数据 —— 这也是坚持让记录足够轻量的原因：
 * 没有连续数据，就没有早期预警。
 */

import { SPECIES, resolveStage } from '../data/species.js';
import { VACCINE_PLANS, SEASONS, SENIOR_CARE } from '../data/care.js';
import { bodyCondition, waterTarget } from './nutrition.js';

/** 今日任务：从物种护理表里筛出"今天该做"的项。 */
export function dailyTasks(pet, date = new Date()) {
  const sp = SPECIES[pet?.species];
  if (!sp) return [];
  const month = date.getMonth() + 1;
  const sheddingSeason = [3, 4, 5, 9, 10, 11].includes(month);

  return sp.care
    .filter((c) => {
      if (c.freq === 'daily') return true;
      if (c.freq === 'weekly') return date.getDay() === 0; // 周日做周检
      if (c.freq === '2-3d') return date.getDate() % 3 === 0;
      return false;
    })
    .map((c) => ({
      id: c.id,
      name: c.season === '换毛季' && sheddingSeason ? `${c.name}（换毛季，每日）` : c.name,
      why: c.why,
      emphasize: Boolean(c.season && sheddingSeason),
    }));
}

/** 疫苗与预防项状态。 */
export function vaccineStatus(pet, ageMonths) {
  const plan = VACCINE_PLANS[pet?.species] ?? [];
  const done = pet?.vaccines ?? {};
  return plan.map((item) => {
    const doneDate = done[item.id];
    const due = ageMonths >= item.dueMonths;
    return {
      ...item,
      done: Boolean(doneDate),
      doneDate: doneDate ?? null,
      state: doneDate ? 'done' : due ? 'overdue' : 'upcoming',
    };
  });
}

/** 当季护理重点。 */
export function seasonFor(date = new Date()) {
  const m = date.getMonth() + 1;
  return SEASONS.find((s) => s.months.includes(m)) ?? SEASONS[0];
}

/**
 * 生成预警列表。
 * @param {object} pet
 * @param {object[]} logs   倒序日志（最新在前）
 * @param {number} ageMonths
 */
export function buildAlerts(pet, logs = [], ageMonths = 0, plan = null) {
  const out = [];
  if (!pet) return out;
  const push = (level, title, detail, action = null) => out.push({ level, title, detail, action });

  // 饮水
  const water = waterTarget(pet.species, pet.weightKg);
  const todayLog = logs[0];
  if (water && todayLog?.waterMl > 0) {
    if (todayLog.waterMl < water.min * 0.8) {
      push(
        'warn',
        `饮水量偏低（${todayLog.waterMl}ml / 目标 ${water.min}-${water.max}ml）`,
        '可能原因：水碗位置不合适、水不够新鲜、天气变化，也可能是身体不适的早期信号。猫的饮水不足与泌尿道疾病直接相关。',
        '增加水碗数量、换用流动水或提高湿粮比例；持续偏低且伴精神变化请走症状自查。',
      );
    } else if (water && todayLog.waterMl > water.max * 1.5) {
      push('warn', '饮水量明显偏高', '多饮多尿是糖尿病、慢性肾病、甲状腺功能异常的共同早期信号。', '连续 3 天偏高请安排血检与尿检。');
    }
  }

  // 体重
  if (pet.weightKg > 0) {
    const bc = bodyCondition(pet.species, pet.breed, pet.weightKg);
    if (['over', 'obese'].includes(bc.level)) {
      push('warn', bc.level === 'obese' ? '体重进入肥胖区间' : '体重超出品种标准', bc.label, '打开饮食处方，按减重方案重算每日热量。');
    } else if (bc.level === 'thin') {
      push('warn', '体重明显低于品种标准', bc.label, '先排查牙病、寄生虫与慢性消耗性疾病。');
    }
  }
  const trend = weightTrend(logs);
  if (trend && Math.abs(trend.pct) >= 5) {
    push(
      trend.pct > 0 ? 'warn' : 'danger',
      `一个月内体重变化 ${trend.pct > 0 ? '+' : ''}${trend.pct}%`,
      trend.pct > 0
        ? '一个月增重超过 5% 通常来自热量过剩，此时调整最容易。'
        : '非计划性体重下降是最需要查因的信号之一，不要当成"瘦下来了"。',
      '打开体重曲线核对记录，并按需安排体检。',
    );
  }

  // 进食
  if (plan?.energy && todayLog?.foodGrams > 0 && plan.portions?.dry?.grams > 0) {
    const target = plan.portions.dry.grams + plan.portions.wet.grams;
    const ratio = todayLog.foodGrams / target;
    if (ratio < 0.6) push('warn', '今日进食明显偏少', '食欲下降往往是第一个可观察到的异常。', '记录持续时间；猫超过 24 小时不吃需就医。');
    else if (ratio > 1.4) push('info', '今日进食明显偏多', '偶尔一次不必紧张，持续则需重算热量或检查是否有多饮多食（内分泌问题）。', null);
  }

  // 疫苗 / 预防
  const vac = vaccineStatus(pet, ageMonths).filter((v) => v.state === 'overdue');
  if (vac.length) {
    push('info', `有 ${vac.length} 项预防措施待完成`, vac.map((v) => v.name).join('、'), '完成后在档案里打勾，会自动记录日期。');
  }

  // 生命阶段切换
  const stage = resolveStage(pet.species, ageMonths);
  const seniorStart = SENIOR_CARE.startAge[pet.species];
  if (seniorStart && ageMonths >= seniorStart && !pet.seniorPlanOn) {
    push('info', '已进入老年期', '体检频率、营养重点与家居环境都需要调整。', '启动老年养护方案。');
  } else if (stage?.id === 'junior' && ageMonths >= 10) {
    push('info', '即将从生长期转入成年期', '成年后热量需求会明显下降，绝育后更低。继续按幼年份量喂是发胖的最常见起点。', '在饮食处方里把阶段切到成年并重算。');
  }

  return out;
}

/** 最近一个月的体重变化百分比。 */
export function weightTrend(logs = []) {
  const points = logs.filter((l) => Number(l.weightKg) > 0);
  if (points.length < 2) return null;
  const latest = points[0];
  const monthAgo = points.find((p) => daysApart(p.date, latest.date) >= 21) ?? points[points.length - 1];
  if (monthAgo === latest) return null;
  const pct = Math.round(((latest.weightKg - monthAgo.weightKg) / monthAgo.weightKg) * 1000) / 10;
  return { from: monthAgo, to: latest, pct };
}

function daysApart(a, b) {
  return Math.abs(Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000));
}
