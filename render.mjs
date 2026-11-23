import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { also, dateCheck, dateCheckFoot, day, grid, heroes, judgeNote, numbers, regions, sources, timeline } from './stories.mjs';

const size = 1024;
const margin = 14;
const right = size - margin;
const width = right - margin;
const paper = '#f6f1e7';
const ink = '#16213a';
const red = '#b3261e';
const light = '#fff9eb';
const muted = '#56575c';
const rule = '#c9c0b0';
const serif = 'FreeSerif';
const sans = 'FreeSans';
const shrinkLog = [];

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);

function element(name, attributes, content) {
  const properties = Object.entries(attributes).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  return content === undefined ? `<${name}${properties}/>` : `<${name}${properties}>${content}</${name}>`;
}

const rect = (x, y, w, h, fill, extra = {}) =>
  element('rect', { x, y, width: w, height: h, fill, ...extra });
const line = (x1, y1, x2, y2, stroke = rule, weight = 1) =>
  element('line', { x1, y1, x2, y2, stroke, 'stroke-width': weight });
const circle = (cx, cy, r, fill, extra = {}) => element('circle', { cx, cy, r, fill, ...extra });
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => element('ellipse', { cx, cy, rx, ry, fill, ...extra });
const path = (d, fill, extra = {}) => element('path', { d, fill, ...extra });
const group = (content, transform) => element('g', transform ? { transform } : {}, content);
const outline = (stroke, weight = 1) => ({ stroke, 'stroke-width': weight, 'stroke-linejoin': 'round' });

function text(x, y, value, options = {}, trailingSpan = '') {
  const { font = sans, size = 12, bold = false, weight = bold ? 700 : 400, italic = false,
    fill = ink, anchor = 'start', tracking = 0 } = options;
  return element('text', {
    x, y, fill, 'font-family': font, 'font-size': size, 'font-weight': weight,
    'font-style': italic ? 'italic' : 'normal', 'text-anchor': anchor, 'letter-spacing': tracking,
  }, escape(value) + trailingSpan);
}

// Approximate glyph advances in ems, grouped by width for the two typefaces.
const advances = {
  [serif]: [
    ['MW', 0.94], ['mw', 0.77], ['ABCDEFGHKNOPQRTUVXYZ', 0.71], ['JLS', 0.57], ['I', 0.39],
    ['bdghnopqu', 0.56], ['aceksvxyz', 0.49], ['0123456789', 0.51], ['frt', 0.37], ['ijl', 0.29],
  ],
  [sans]: [
    ['MW', 0.90], ['mw', 0.80], ['ABDGHKNOPQRUVXY', 0.73], ['CEFSTZ', 0.65], ['JL', 0.57], ['I', 0.29],
    ['abdeghknopqsuvxyz', 0.56], ['c', 0.52], ['0123456789', 0.56], ['frt', 0.34], ['ijl', 0.25],
  ],
};
const punctuation = [
  [' ,.:;!|·', 0.29], ['()[]\'"-’', 0.36], ['/', 0.34], ['–+?%&', 0.61], ['—', 1],
];

function estimate(value, { font = sans, size = 12, bold = false, weight = bold ? 700 : 400, tracking = 0 } = {}) {
  const glyphs = [...value.normalize('NFD').replace(/\p{Mark}/gu, '')];
  const widths = advances[font] ?? advances[sans];
  const ems = glyphs.reduce((sum, glyph) => {
    const match = widths.find(([letters]) => letters.includes(glyph))
      ?? punctuation.find(([letters]) => letters.includes(glyph));
    return sum + (match?.[1] ?? 0.62);
  }, 0);
  const allowance = font !== serif && weight >= 600 ? 1.07 : 1.025;
  return ems * size * allowance + glyphs.length * tracking;
}

function wrap(value, limit, style) {
  const lines = [];
  let current = '';
  for (const word of value.split(/\s+/u)) {
    const next = current ? `${current} ${word}` : word;
    if (current && estimate(next, style) > limit) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  lines.push(current);
  if (lines.length > 1) {
    const last = lines.length - 1;
    const words = lines[last - 1].split(' ');
    while (words.length > 1 && estimate(lines[last], style) < limit * 0.4) {
      const tail = `${words.pop()} ${lines[last]}`;
      const previous = words.join(' ');
      if (estimate(previous, style) < estimate(tail, style)) break;
      lines[last - 1] = previous;
      lines[last] = tail;
    }
  }
  return lines;
}

function fit(value, limit, maxLines, style, label, minimumSize = style.size - 4) {
  const initialSize = style.size;
  for (let step = 0; ; step++) {
    const candidate = Math.max(minimumSize, Number((initialSize - step * 0.25).toFixed(2)));
    const adjusted = { ...style, size: candidate };
    const lines = wrap(value, limit, adjusted);
    if (lines.length <= maxLines && lines.every((row) => estimate(row, adjusted) <= limit)) {
      if (candidate < initialSize) shrinkLog.push(`${label}: ${initialSize} → ${candidate} px`);
      return { lines, style: adjusted };
    }
    if (candidate === minimumSize) break;
  }
  throw new Error(`Text exceeds the space for ${label}: ${value}`);
}

function linesOfText(x, y, { lines, style }, leading) {
  return lines.map((row, index) => text(x, y + index * leading, row, style)).join('');
}

function paragraph(x, y, value, limit, maxLines, leading, style, label, minimumSize) {
  return linesOfText(x, y, fit(value, limit, maxLines, style, label, minimumSize), leading);
}

const regionColors = {
  Europe: '#355284', 'Middle East': '#8c3c26', Africa: '#755317', Asia: '#21634f',
  Americas: '#68456d', Oceania: '#23636e', World: '#4d5363',
};
const regionCounts = Object.fromEntries(regions.map((region) => [region, 0]));
const storyAreas = [...heroes, ...grid].map(({ area }) => area).concat(also.map(({ region }) => region));
for (const region of storyAreas) {
  assert(Object.hasOwn(regionCounts, region), `Unknown story region: ${region}`);
  regionCounts[region]++;
}
const storyCount = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);
assert.equal(storyCount, 39, 'Region counts must add up to 39 stories');

const statuses = {
  CONFIRMED: { fill: '#deeadc', ink: '#24583b', meaning: 'carried by 2+ outlets' },
  OFFICIAL: { fill: '#f4e5bd', ink: '#694710', meaning: 'on the record from an authority' },
  CLAIM: { fill: '#ece0ef', ink: '#633775', meaning: "one side's account" },
  REPORTED: { fill: '#e9e7e3', ink: '#454b57', meaning: 'one outlet so far' },
};

function statusPill(rightEdge, y, status, small = false) {
  const colors = statuses[status];
  const height = small ? 13 : 16;
  const style = { size: small ? 8.1 : 9.4, bold: true, tracking: 0.42, fill: colors.ink };
  const w = Math.ceil(estimate(status, style) + (small ? 10 : 13));
  const x = rightEdge - w;
  return rect(x, y, w, height, colors.fill, { rx: height / 2 })
    + text(x + w / 2, y + (small ? 9.4 : 11.45), status, { ...style, anchor: 'middle' });
}

function storyLabel(x, y, story, limit, hero = false) {
  const color = regionColors[story.area];
  const radius = hero ? 7.8 : 6.3;
  return circle(x + radius, y, radius, color)
    + text(x + radius, y + (hero ? 3.35 : 2.9), story.id,
      { size: hero ? 9.5 : 8.4, bold: true, anchor: 'middle', fill: light })
    + paragraph(x + radius * 2 + 5, y + (hero ? 3.6 : 3.3), story.region, limit - radius * 2 - 5, 1, 0,
      { size: hero ? 10.8 : 9.5, bold: true, fill: color, tracking: 0.55 }, `${story.id} region`);
}

const band = (w, h, fill) => rect(0, 0, w, h, fill);

const illustrations = {
  summit() {
    const teal = '#264e53';
    const gold = '#f3d28c';
    const seats = [[48, 81], [65, 58], [91, 40], [124, 29], [200, 29], [233, 40], [259, 58], [276, 81]];
    return band(324, 110, '#8eb0a6') + rect(0, 0, 324, 110, 'url(#stipple)')
      + path('M12 107C50 16 107 4 162 4S274 16 312 107', 'none', outline('#b9cdc0', 2))
      + path('M26 108C58 35 101 15 162 15S266 35 298 108', 'none', outline('#d2ded0', 1))
      + ellipse(162, 90, 97, 29, '#4d7771')
      + seats.map(([x, y]) => rect(x - 7, y - 5, 14, 9, teal, { rx: 3 })
        + circle(x, y - 9, 3.3, gold)).join('')
      + ellipse(162, 84, 96, 22, teal)
      + ellipse(162, 80, 96, 19, '#d4a66e')
      + ellipse(162, 80, 76, 12, '#e9c592', outline('#a57454'))
      + path('M162 62V75M147 76H177', 'none', outline(teal, 3))
      + circle(162, 44, 21, teal, outline(light, 1.5))
      + ellipse(162, 44, 9, 21, 'none', outline('#c4d7c6'))
      + path('M142 44H182M147 33Q162 40 177 33M147 55Q162 48 177 55', 'none', outline('#c4d7c6'))
      + path('M149 41L154 34L162 33L164 37L158 39L160 43L155 46L155 52L151 49L152 44ZM168 40L176 42L175 46L171 47L168 53L165 50L166 44Z', gold);
  },
  blocks() {
    const sky = '#293756';
    const rubble = '#838792';
    const stars = [[45, 42], [79, 19], [100, 34], [116, 20], [247, 13], [279, 43], [307, 24]];
    const windows = [[101, 39], [121, 39], [142, 39], [162, 39], [101, 56], [121, 56], [142, 56],
      [162, 56], [182, 56], [101, 73], [121, 73], [142, 73], [162, 73], [101, 90], [121, 90], [142, 90]];
    return band(324, 110, sky) + rect(0, 0, 324, 110, 'url(#stipple)')
      + circle(266, 28, 14, '#c8bdab') + circle(273, 23, 14, sky)
      + stars.map(([x, y]) => circle(x, y, 1, '#d5c9ae')).join('')
      + path('M0 85L17 85V72H29V78H43V65H54V79H73V87H88V110H0ZM226 110V82H246V72H255V78H270V60H282V83H301V74H313V83H324V110Z', '#3d4b67')
      + path('M86 106V29H173L179 38L172 43L190 49L197 61L183 69L202 76L194 81L209 88L214 106Z', '#686e82', outline('#a0a3ae'))
      + path('M92 48H176M92 65H185M92 82H190', 'none', outline('#555e75'))
      + windows.map(([x, y], i) => rect(x, y, 9, 6, i % 3 === 0 ? '#f5cf83' : '#303a54')).join('')
      + path('M0 105L77 104L92 98L151 103L169 96L183 102L195 92L204 96L217 83L227 97L242 96L253 104L324 102V110H0Z', '#535b71')
      + path('M158 104L176 96L185 103M199 100L214 92L222 94M219 106L231 99L240 105M248 107L255 103L265 105', 'none', outline(rubble, 2))
      + group(path('M-14 -4L-4 0H4L14 -4L9 2H4L2 5H-2L-4 2H-9Z', '#e1c397'), 'translate(218 24)')
      + group(path('M-14 -4L-4 0H4L14 -4L9 2H4L2 5H-2L-4 2H-9Z', '#e1c397'), 'translate(295 44) scale(.72)');
  },
  radar() {
    const silhouette = '#283b3d';
    const wave = '#b3c8b8';
    return band(324, 110, '#d0b89c') + rect(0, 0, 324, 110, 'url(#stipple)')
      + circle(246, 31, 20, '#eed19c')
      + path('M233 67C220 51 238 55 220 44C205 35 207 28 200 24C218 25 219 32 232 36C258 44 244 50 260 56L264 69Z', '#777369', { opacity: 0.62 })
      + path('M247 69C238 60 252 58 235 47C244 48 249 52 254 52C262 53 265 62 271 69Z', '#a59a85')
      + rect(0, 65, 324, 45, '#587e7a')
      + path('M0 75H77M202 75H324M17 82H70M223 83H300M257 91H324M271 98H305', 'none', outline(wave, 1.3))
      + path('M0 101L34 95H70L86 92H201L223 96H259L281 110H0Z', '#a48a64')
      + path('M67 84H87L97 69H117V84H198V95H67ZM127 83L134 64L143 64L153 83ZM127 64L145 31L161 39L143 73Z', silhouette)
      + path('M98 73H111V80H94ZM144 37L155 42L142 67L132 62Z', '#8eaa9d')
      + [85, 111, 165, 186].map((x) => circle(x, 95, 7, '#233235') + circle(x, 95, 2.5, '#869688')).join('');
  },
  tanker() {
    const sea = '#4d6e78';
    const hull = '#29394b';
    const foam = '#a8bcb2';
    return band(324, 110, '#b99386') + rect(0, 0, 324, 110, 'url(#stipple)')
      + circle(265, 44, 18, '#ecd1a5')
      + path('M0 64L24 59L45 61L69 55L94 58L123 64H324V72H0Z', '#8e7d81')
      + path('M109 58C108 49 115 44 112 36C109 25 122 16 138 17C149 17 154 12 168 13C183 14 187 8 205 10C199 19 190 23 177 25C162 29 160 36 143 37C129 39 125 46 123 58Z', '#484352')
      + path('M119 52C120 38 130 33 146 32C162 31 169 24 183 23C173 29 169 34 156 36C137 39 132 48 129 57Z', '#70606a')
      + rect(0, 66, 324, 44, sea)
      + path('M8 73H51M255 73H315M17 86H44M6 100H108M129 104H201M247 103H309M284 83H322', 'none', outline(foam, 1.2))
      + path('M66 79H247L277 83L244 95H70L45 91Z', '#3d5667')
      + path('M59 72H229L252 64H269L247 86H79Q67 84 59 72Z', hull, outline('#d2b49e'))
      + path('M66 79H254L247 86H79Z', '#905449')
      + path('M82 72V55H108V49H119V63H127V72Z', '#e3d4b2', outline(hull))
      + path('M84 55V49H106V55M94 49V40M88 42H101M86 59H104M87 65H100', 'none', outline(hull, 2))
      + path('M131 71V65H155V71M165 71V65H189V71M199 71V65H223V71M137 67H216', 'none', outline('#e0be96', 2))
      + path('M275 94Q282 90 290 94T305 94', 'none', outline(foam, 1.2))
      + path('M281 94A6 6 0 0 1 293 94Z', hull, outline('#c4b49b'))
      + path('M287 88V85M282 90L280 88M292 90L294 88', 'none', outline(hull, 1.5));
  },
  tennis() {
    const chalk = '#e9e4c5';
    return band(192, 58, '#527b70') + path('M11 49L33 9H150L178 49Z', '#355866', outline(chalk, 1.4))
      + path('M23 29H165M94 9V49M44 9L29 49M138 9L158 49', 'none', outline(chalk))
      + path('M21 31V24H167V31M28 27H160', 'none', outline('#c3d9ce'))
      + circle(62, 20, 6, '#f1cb66', outline('#fff0b1'))
      + path('M60 14Q57 19 63 25', 'none', outline('#fff0b1'));
  },
  f1() {
    const night = '#212942';
    const tire = '#151c2c';
    const gold = '#dcb783';
    const checks = [[6, 0], [18, 0], [0, 6], [12, 6], [24, 6], [6, 12], [18, 12]];
    return band(192, 58, night)
      + path('M0 39V23H12V13H26V22H42V9H59V35H74V17H90V12H108V27H119V35H151V13H169V22H182V31H192V39Z', '#3b405a')
      + path('M0 18H29M43 14H58M77 21H114M156 23H192', 'none', outline('#a27586', 2.4))
      + path('M12 25H47M65 17H87M163 30H189', 'none', outline('#79a5a1', 2.4))
      + path('M0 33H32M93 33H113M162 37H192', 'none', outline('#c3a277', 2))
      + rect(0, 39, 192, 19, '#30374b')
      + path('M0 46H17M5 54H26M72 54H119', 'none', outline('#796377', 2))
      + group(path('M-9 21L0 -1', 'none', outline('#ded3bb', 2))
        + rect(0, 0, 30, 18, '#ece4cd')
        + checks.map(([x, y]) => rect(x, y, 6, 6, night)).join(''), 'translate(127 19.5) skewY(4)')
      + group(ellipse(67, 50, 53, 3, tire)
        + path('M19 25H34V29H27L32 36H39L51 28H65L72 35H83L95 39L109 40L112 44H119V48H91L82 44H49L42 47H27L24 39L21 29H17Z', gold, outline(tire, 1.2))
        + path('M50 39H77L88 43H49Z', '#628b85')
        + path('M61 34L66 30H84L87 33H77L74 37H68Z', tire)
        + circle(73, 30, 4, '#e9d5b1', outline(tire))
        + circle(37, 43, 9, tire, outline('#a69c99', 1.2))
        + circle(100, 44, 8, tire, outline('#a69c99', 1.2))
        + circle(37, 43, 3.7, '#929caa') + circle(100, 44, 3.3, '#929caa'), 'translate(-2 0) scale(.93 1)');
  },
  flag() {
    const checks = Array.from({ length: 24 }, (_, index) => {
      const col = index % 8;
      const row = Math.floor(index / 8);
      if ((col + row) % 2 === 0) return '';
      return rect(12 + col * 9, row * 9, 9, 9, '#25304a');
    }).join('');
    return band(192, 58, '#4b506b') + path('M83 9H192M106 21H192M82 34H192M0 49H106', 'none', outline('#b48483', 2))
      + group(line(12, -2, 12, 52, '#f6d39c', 2) + rect(12, 0, 72, 27, '#eee8d6') + checks, 'translate(20 12) skewY(-9)');
  },
  cricket() {
    return band(192, 58, '#8c9868') + path('M23 58L55 0H110L134 58Z', '#cfb17b')
      + path('M41 25H119M25 52H132M51 12H114', 'none', outline('#f7e1ac', 1.4))
      + path('M63 25V47M72 25V47M81 25V47M62 26H82', 'none', outline('#f7ebc8', 3))
      + path('M106 5L110 7L97 27L100 29L88 46Q85 48 80 44L92 24L95 25Z', '#704d3d')
      + circle(47, 37, 4.5, '#9b4839', outline('#f3d59a'));
  },
  fire() {
    return band(192, 58, '#c49376') + path('M20 44V26L43 17V24L63 15V24L86 15V44Z', '#6c4747')
      + path('M0 44H192V58H0ZM92 44L104 32L110 37L120 29L137 44Z', '#593e46')
      + path('M73 44C58 32 75 27 78 17C80 25 87 23 88 6C109 21 95 24 104 30C111 27 109 22 111 19C123 33 115 39 114 44Z', '#af472e')
      + path('M84 44C77 34 90 31 91 23C101 29 93 33 101 36C107 31 109 38 107 44Z', '#f0c275')
      + path('M104 7Q124 11 126 18Q126 22 144 23M119 4Q141 9 148 14H171', 'none', outline('#836566', 4));
  },
  boat() {
    return band(192, 58, '#577d83') + path('M0 18Q16 10 32 18T64 18T96 18T128 18T160 18T192 18M0 42Q16 34 32 42T64 42T96 42T128 42T160 42T192 42M0 52Q16 44 32 52T64 52T96 52T128 52T160 52T192 52', 'none', outline('#a8c2b6', 1.5))
      + group(path('M10 11H96L82 29H32Q21 27 10 11Z', '#313f4b', outline('#ead8ae', 1.4))
        + path('M37 12V2H70L76 12Z', '#e0c598') + path('M27 16H88', 'none', outline('#e0c598', 2)), 'translate(19 6) rotate(14 54 21)');
  },
  drone() {
    return band(192, 58, '#515670') + circle(119, 22, 17, '#9d98a6')
      + path('M0 53L17 38H38V31H49V39H65V47H80V58H0ZM115 58V51H128V46H142V42H156V52H192V58Z', '#707486')
      + path('M28 12H59L65 17H83L89 12H119L108 19L90 24L81 23L77 28H66L61 22L45 22Z', '#242f49', outline('#ccc6cb'))
      + path('M69 24H76M18 31H39M122 30H157M150 22H180', 'none', outline('#b1aab4'));
  },
  exam() {
    return band(192, 58, '#839b8f') + path('M0 47H192V58H0Z', '#64867b')
      + group(path('M0 0H44L56 12V47H0Z', '#eee4c8', outline('#425f58', 1.5))
        + path('M44 0V12H56M8 11H33M8 19H38M8 27H27M8 35H24', 'none', outline('#7e9890', 1.4))
        + path('M30 30L36 36L47 23', 'none', outline('#2e6856', 3)), 'translate(44 7) rotate(-9 28 24)')
      + path('M111 47L132 18L137 21L116 50L109 53Z', '#324e50', outline('#c6b784'));
  },
  ship() {
    return band(192, 58, '#8b9fa6') + path('M0 35H192V58H0Z', '#546f80')
      + path('M0 46H29M12 52H111M112 40H192', 'none', outline('#b5c5bd'))
      + path('M18 31H145L127 44H33Z', '#293b50', outline('#acb9b5'))
      + path('M31 31V22H49V31M46 31V16H65V31M66 31V24H104V31M109 31V20H115V31M50 16V10H58V16', '#e1d5b9', outline('#4c6370'))
      + path('M95 26L85 19L94 20L89 10L100 17L102 5L107 16L114 9L112 19L122 16L117 24L114 29Z', '#e8b979', outline('#a86651'));
  },
  crowd() {
    const figures = [[17, 42], [38, 37], [58, 45], [82, 32], [107, 43], [133, 36], [159, 45], [180, 40]];
    return band(192, 58, '#ab8876') + path('M0 19H192M0 28H192', 'none', outline('#c7a695'))
      + path('M32 13H61V24H32ZM67 9H98V20H67ZM121 16H150V28H121Z', '#e9d6b0', outline('#584654'))
      + path('M46 23V49M83 19V52M135 28V49', 'none', outline('#574757', 2))
      + figures.map(([x, y], i) => circle(x, y - 5, 5, i % 2 ? '#6c4d53' : '#3b3b51')
        + rect(x - 9, y + 1, 18, 24, i % 2 ? '#6c4d53' : '#3b3b51', { rx: 6 })).join('');
  },
  ballot() {
    return band(192, 58, '#a6a990') + path('M0 45H192V58H0Z', '#89917a')
      + path('M35 32L49 22H111L125 32V55H35Z', '#526b67', outline('#d8d6b6', 1.4))
      + path('M35 32H125M66 27H98', 'none', outline('#233e48', 2.5))
      + path('M62 6L88 1L93 23L67 28Z', '#f0e6c9', outline('#526b67'))
      + path('M70 13L76 17L84 8', 'none', outline('#526b67', 2));
  },
  mine() {
    const earth = '#a87c5f';
    const dark = '#514743';
    return band(192, 58, '#d7bb93') + circle(119, 13, 10, '#eed5a5')
      + path('M0 34L23 25L48 29L67 24L105 33L138 24L168 30L192 26V58H0Z', '#bb9772')
      + path('M0 40L55 35L94 40L140 34L192 38V58H0Z', earth)
      + path('M0 51L28 47L58 50M11 39H31M123 50L139 48M145 39L167 37', 'none', outline('#d0ab7e', 1.5))
      + path('M49 29L46 52', 'none', outline(dark, 4))
      + path('M48 6L70 35H26Z', '#ebd5ad', outline('#8c3c26', 3))
      + path('M41 24A7 6 0 0 1 55 24Q55 27 52 28V31H44V28Q41 27 41 24Z', dark)
      + circle(45, 24, 1.45, '#ebd5ad') + circle(51, 24, 1.45, '#ebd5ad')
      + group(ellipse(101, 48, 23, 6, '#86684f')
        + path('M83 46Q86 38 101 38T119 46V49Q100 53 83 48Z', '#4f554e', outline(dark))
        + ellipse(101, 43, 14, 3.6, '#768071')
        + path('M76 51L84 47L94 49L106 48L116 51L126 49V58H76Z', earth), 'translate(-17 0)')
      + path('M18 55L17 49L13 46M17 52L22 47M71 52L70 46L66 43M70 49L74 45', 'none', outline('#71593f', 1.2));
  },
  health() {
    const canvas = '#e6d9b9';
    const seam = '#536a61';
    return band(192, 58, '#95aaa0')
      + path('M0 25L24 15L45 23L60 18L83 25L106 17L138 27L162 21L192 28V58H0Z', '#789184')
      + path('M0 43L81 37L143 43L192 40V58H0Z', '#718474')
      + path('M32 58L74 41L93 40L69 58Z', '#bca88b')
      + path('M19 43L48 14H90L110 43Z', canvas, outline(seam, 1.4))
      + path('M48 14L75 43H19Z', '#f1e6cc', outline(seam, 1.4))
      + path('M48 28L60 43H36Z', '#5c7468')
      + path('M82 25H88V30H93V36H88V41H82V36H77V30H82Z', '#a2473c')
      + path('M115 52L116 41L113 46L110 44L115 33L120 31H126L131 33L137 43L134 46L129 41L130 53H125L123 45L120 53Z', '#314f51', outline(canvas, 1.2))
      + circle(123, 26, 6, '#314f51', outline(canvas, 1.2))
      + path('M119 26H127', 'none', outline('#a5bbb0', 2.4));
  },
  capitol() {
    const stone = '#e5d7bc';
    const shaded = '#a8a59d';
    const trim = '#4b536b';
    return band(192, 58, '#8d95a6') + circle(115, 16, 10, '#cbbaaa')
      + path('M0 43H192V58H0Z', '#727d91')
      + path('M15 49H118V53H15ZM21 34H112V49H21Z', stone, outline(trim))
      + path('M46 31H87V37H46ZM49 31C50 21 56 15 64 14H69C77 15 83 21 84 31Z', stone, outline(trim, 1.4))
      + path('M64 14V9H69V14M66.5 9V4M56 30Q57 20 64 15M77 30Q76 20 69 15', 'none', outline(trim, 1.2))
      + path('M40 37L66.5 29L93 37Z', shaded, outline(trim))
      + path('M30 49V39M42 49V39M54 49V39M66 49V39M78 49V39M90 49V39M102 49V39', 'none', outline(trim, 2.6))
      + path('M119 40L126 34H146L153 40V51H119Z', '#4d636a', outline(stone))
      + path('M127 22L142 19L146 35L131 38Z', '#f2e8cf', outline(trim))
      + path('M131 28L135 31L141 24', 'none', outline('#40695a', 2.2))
      + path('M119 40H153', 'none', outline(stone));
  },
};

function artPanel(story, x, y, w, artHeight, height = artHeight) {
  return element('svg', {
    x, y, width: w, height, viewBox: `0 0 ${w} ${artHeight}`, preserveAspectRatio: 'none', overflow: 'hidden',
  }, illustrations[story.art]());
}

const deckBaseline = 130;
const mastheadRuleY = 140.5;
const numbersTop = 142;
const numbersHeight = 40;
const completeTop = 186;
const completeHeight = 20;
const regionStripTop = completeTop + completeHeight;
const regionStripHeight = 19;

function masthead() {
  const strip = { size: 11, bold: true, tracking: 1.4 };
  const dateStyle = { font: serif, size: 86, bold: true, anchor: 'middle' };
  const deckStyle = { font: serif, size: 18, italic: true, fill: '#7f251f', anchor: 'middle' };
  const dateScale = Math.min(1, width / estimate(day.date, dateStyle));
  const deckScale = Math.min(1, (width - 12) / estimate(day.deck, deckStyle));
  return text(margin, 24, day.kicker, { ...strip, fill: red })
    + text(right, 24, day.tally, { ...strip, anchor: 'end' })
    + group(text(0, 96, day.date, dateStyle), `translate(${size / 2} 0) scale(${dateScale} 1)`)
    + group(text(0, deckBaseline, day.deck, deckStyle), `translate(${size / 2} 0) scale(${deckScale} 1)`)
    + line(margin, mastheadRuleY - 3, right, mastheadRuleY - 3, ink, 1.5)
    + line(margin, mastheadRuleY, right, mastheadRuleY, ink);
}

function completeBand() {
  return rect(margin, completeTop, width, completeHeight, red)
    + text(size / 2, completeTop + 14, day.complete,
      { size: 11.4, bold: true, fill: light, tracking: 1.05, anchor: 'middle' });
}

function regionStrip() {
  const style = { size: 11, bold: true, fill: '#fff', tracking: 0.5, anchor: 'middle' };
  const segments = regions.map((region) => {
    const count = regionCounts[region];
    const label = `${region.toUpperCase()} ${count}`;
    return { region, count, label, minimumWidth: Math.ceil(estimate(label, style) + 14) };
  });
  assert(segments.reduce((sum, segment) => sum + segment.minimumWidth, 0) <= width,
    'Region strip labels must fit on the page');

  const fixedWidths = new Map();
  let remainingWidth = width;
  let remainingStories = storyCount;
  // Give undersized segments their minimum width, then divide the remaining width by count.
  while (true) {
    const undersized = segments.find(({ region, count, minimumWidth }) =>
      !fixedWidths.has(region) && remainingWidth * count < minimumWidth * remainingStories);
    if (!undersized) break;
    fixedWidths.set(undersized.region, undersized.minimumWidth);
    remainingWidth -= undersized.minimumWidth;
    remainingStories -= undersized.count;
  }

  let edge = margin;
  return segments.map(({ region, count, label }) => {
    const left = Math.round(edge);
    edge += fixedWidths.get(region) ?? remainingWidth * count / remainingStories;
    const segmentWidth = Math.round(edge) - left;
    return rect(left, regionStripTop, segmentWidth, regionStripHeight, regionColors[region])
      + text(left + segmentWidth / 2, regionStripTop + 13.5, label, style);
  }).join('');
}

const sectionStyle = { size: 12.6, bold: true, tracking: 1.25, fill: red };
const sectionTitle = (x, y, label) => text(x, y, label, sectionStyle);
const timelineTop = regionStripTop + regionStripHeight;

function numbersBand() {
  const heading = ['THE DAY IN', 'NUMBERS'];
  const headingStyle = { ...sectionStyle, size: 11.25, tracking: 0.85 };
  const numberStyle = { size: 23, bold: true, font: serif, anchor: 'middle' };
  const labelStyle = { size: 11, anchor: 'middle' };
  const inset = 10;
  const headingWidth = Math.ceil(Math.max(...heading.map((row) => estimate(row, headingStyle)))) + 2 * inset;
  const columnWidth = (width - headingWidth) / numbers.length;
  return rect(margin, numbersTop, width, numbersHeight, '#eee7d8')
    + linesOfText(margin + inset, numbersTop + 17, { lines: heading, style: headingStyle }, 13)
    + numbers.map(({ n, label }, index) => {
      const left = margin + headingWidth + index * columnWidth;
      const center = left + columnWidth / 2;
      return line(left, numbersTop + 6, left, numbersTop + numbersHeight - 6)
        + paragraph(center, numbersTop + 22, n, columnWidth - inset, 1, 0,
          numberStyle, `number ${n}`, numberStyle.size)
        + paragraph(center, numbersTop + 35, label, columnWidth - inset, 1, 0,
          labelStyle, `number ${n} label`, labelStyle.size);
    }).join('');
}

function timelineBand() {
  const heading = 'THE DAY IN UTC (APPROX.)';
  const ruleStart = margin + Math.ceil(estimate(heading, sectionStyle)) + 12;
  const colWidth = width / timeline.length;
  return sectionTitle(margin, timelineTop + 13, heading)
    + line(ruleStart, timelineTop + 9, right, timelineTop + 9)
    + timeline.map(({ t, text: description }, index) => {
      const x = margin + index * colWidth;
      const inset = index === 0 ? 0 : 5;
      const limit = colWidth - inset - 4;
      return (index === 0 ? '' : line(x, timelineTop + 18, x, timelineTop + 53))
        + paragraph(x + inset, timelineTop + 28, t, limit, 1, 0,
          { size: 13.1, bold: true }, `timeline label ${t}`, 11)
        + paragraph(x + inset, timelineTop + 41, description, limit, 2, 11.1,
          { size: 11.5 }, `timeline ${t}`, 11);
    }).join('');
}

const heroTop = timelineTop + 59;
const heroArtHeight = 55;
const heroHeight = heroArtHeight + 127;

function heroCard(story, index) {
  const w = 324;
  const x = margin + index * 336;
  const y = heroTop;
  const textTop = y + heroArtHeight;
  const inset = 9;
  const contents = w - 2 * inset;
  const left = x + inset;
  const badge = fit(story.badge, contents - 15, 1,
    { size: 11.2, bold: true, tracking: 0.8, fill: light }, `${story.id} badge`).style;
  return rect(x + 0.5, y + 0.5, w - 1, heroHeight - 1, '#faf6ed', outline(rule))
    + artPanel(story, x, y, w, 110, heroArtHeight)
    + rect(left, y + 8, Math.ceil(estimate(story.badge, badge) + 15), 19, red)
    + text(left + 7, y + 21, story.badge, badge)
    + storyLabel(left, textTop + 15, story, contents - 95, true)
    + statusPill(x + w - inset, textTop + 7, story.status)
    + paragraph(left, textTop + 40, story.head, contents - 2, 2, 22.5,
      { font: serif, bold: true, size: 23 }, `${story.id} headline`)
    + paragraph(left, textTop + 80, story.body, contents - 2, 3, 12.4,
      { size: 12.2 }, `${story.id} body`)
    + paragraph(left, textTop + 119, story.src, contents, 1, 0,
      { size: 10.5, italic: true, fill: muted }, `${story.id} source`);
}

const gridTop = heroTop + heroHeight + 3;
const gridHeight = 135;
const gridRowStep = gridHeight + 4;

function gridCard(story, index) {
  const w = 192;
  const artHeight = 53;
  const x = margin + (index % 5) * 201;
  const y = gridTop + Math.floor(index / 5) * gridRowStep;
  const left = x + 7;
  const contents = w - 14;
  const tagStyle = fit(story.tag, w - 24, 1,
    { size: 10.4, bold: true, tracking: 0.65, fill: light, anchor: 'end' }, `${story.id} tag`).style;
  const tagWidth = Math.ceil(estimate(story.tag, tagStyle) + 12);
  return rect(x + 0.5, y + 0.5, w - 1, gridHeight - 1, '#faf6ed', outline(rule))
    + artPanel(story, x, y, w, 58, artHeight)
    + statusPill(x + w - 5, y + 4, story.status, true)
    + rect(x + w - tagWidth, y + artHeight - 16, tagWidth, 16, ink)
    + text(x + w - 6, y + artHeight - 4.5, story.tag, tagStyle)
    + storyLabel(left, y + 64, story, contents)
    + paragraph(left, y + 83, story.head, contents - 2, 2, 15.6,
      { font: serif, bold: true, size: 16.1 }, `${story.id} headline`, 14)
    + paragraph(left, y + 110.5, story.body, contents - 2, 2, 11,
      { size: 11.2 }, `${story.id} body`)
    + paragraph(left, y + 131.8, story.src, contents, 1, 0,
      { size: 9.2, italic: true, fill: muted }, `${story.id} source`);
}

const detailsTop = gridTop + gridRowStep + gridHeight + 2;
const detailsBottom = 902.5;
const mapWidth = 164;
const detailsHeadingOffset = 13;
const detailsRuleOffset = 17;
const dateTop = detailsBottom + 0.75;
const dateHeight = 72.75;
const dateBorder = 1;
const noteTop = dateTop + dateHeight + 1.25;
const noteBorder = 0.65;
const mapArea = { name: 'world map', left: margin, right: margin + mapWidth, top: detailsTop, bottom: detailsBottom };
const briefsArea = { name: 'also list', left: mapArea.right + 8, right, top: detailsTop, bottom: detailsBottom };
const dateCheckArea = {
  name: 'date-check box', left: margin, right,
  top: dateTop - dateBorder / 2, bottom: dateTop + dateHeight + dateBorder / 2,
};
const footerArea = { name: 'footer', left: margin, right, top: noteTop - noteBorder / 2, bottom: size };

function assertNoOverlap(a, b) {
  assert(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
    `${a.name} overlaps the ${b.name}`);
}

// Coastlines simplified by hand, in [longitude, latitude] order.
const land = [
  // North America
  [[-168, 66], [-157, 71], [-138, 70], [-125, 72], [-99, 71], [-85, 69], [-80, 63], [-90, 61],
    [-95, 56], [-87, 52], [-80, 54], [-78, 61], [-70, 60], [-60, 53], [-65, 48], [-58, 47],
    [-67, 43], [-74, 41], [-80, 32], [-81, 25], [-86, 30], [-94, 29], [-97, 24], [-91, 19],
    [-87, 22], [-88, 16], [-83, 10], [-77, 8], [-81, 8], [-90, 14], [-101, 18], [-106, 23],
    [-112, 30], [-115, 29], [-124, 42], [-125, 49], [-132, 55], [-141, 60], [-151, 58],
    [-161, 55], [-155, 60], [-165, 61]],
  // South America
  [[-79, 8], [-74, 11], [-67, 10], [-59, 7], [-51, 4], [-48, 0], [-36, -5], [-35, -9],
    [-39, -15], [-42, -23], [-49, -29], [-55, -34], [-62, -40], [-65, -48], [-68, -55],
    [-74, -52], [-75, -44], [-72, -34], [-71, -24], [-75, -16], [-81, -6], [-80, 0]],
  // Greenland
  [[-61, 72], [-23, 72], [-28, 66], [-39, 63], [-44, 60], [-52, 62], [-55, 68]],
  // Europe and Asia
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [8, 58], [12, 56],
    [19, 59], [22, 65], [15, 67], [9, 62], [5, 58], [4, 62], [15, 69], [26, 72], [42, 68],
    [58, 69], [68, 72], [93, 72], [105, 70], [126, 72], [143, 71], [163, 69], [177, 68],
    [180, 65], [171, 62], [163, 61], [161, 55], [155, 51], [156, 59], [146, 59], [140, 53],
    [138, 47], [130, 43], [129, 35], [125, 37], [121, 40], [119, 36], [122, 31], [119, 25],
    [113, 22], [108, 21], [107, 16], [109, 12], [105, 9], [101, 13], [100, 7], [104, 1],
    [100, 3], [96, 14], [92, 22], [87, 22], [81, 15], [77, 8], [74, 12], [70, 22],
    [67, 25], [61, 25], [56, 27], [51, 29], [48, 29], [52, 25], [57, 24], [59, 21],
    [54, 17], [45, 13], [42, 16], [38, 24], [35, 28], [34, 33], [29, 36], [26, 40],
    [33, 42], [38, 43], [32, 46], [28, 45], [28, 41], [25, 40], [23, 36], [19, 40],
    [14, 45], [12, 44], [17, 39], [15, 38], [10, 44], [5, 43], [0, 40], [-3, 36]],
  // Africa
  [[-17, 15], [-16, 22], [-10, 30], [-6, 36], [8, 37], [11, 33], [20, 32], [25, 31],
    [33, 31], [35, 26], [38, 18], [43, 12], [51, 11], [48, 5], [42, -2], [40, -11],
    [39, -17], [35, -24], [32, -30], [26, -34], [19, -35], [15, -28], [12, -19], [13, -12],
    [9, -3], [9, 3], [3, 5], [-5, 5], [-12, 8]],
  // Australia
  [[113, -23], [116, -19], [123, -17], [130, -12], [136, -12], [137, -16], [141, -17],
    [143, -11], [146, -17], [149, -23], [153, -27], [151, -33], [146, -39], [140, -38],
    [136, -34], [130, -32], [124, -33], [116, -35], [114, -29]],
  // British Isles, Iceland, Japan, island Southeast Asia, Madagascar and New Zealand
  [[-10, 52], [-9, 55], [-6, 55], [-5, 58], [-2, 58], [1, 52], [-5, 50]],
  [[-24, 64], [-22, 67], [-14, 66], [-15, 64]],
  [[130, 32], [134, 34], [138, 36], [141, 41], [144, 44], [146, 43], [142, 38], [141, 35], [134, 32]],
  [[95, 5], [100, 3], [106, -5], [115, -8], [109, -8], [103, -5], [99, 0]],
  [[109, 0], [112, 4], [118, 7], [119, 1], [116, -4], [111, -3]],
  [[130, -2], [137, -2], [147, -6], [151, -9], [143, -9], [137, -6], [132, -5]],
  [[49, -12], [50, -16], [47, -24], [44, -26], [43, -22], [45, -16]],
  [[173, -35], [178, -38], [175, -42], [169, -46], [166, -46], [170, -42], [175, -39]],
];

// Pixel offsets keep the dense cluster readable in the small map panel.
const pinOffsets = {
  1: [-10, 13], 2: [-4, -13], 3: [7, 11], 4: [-13, -9], 6: [-24, -1], 7: [-17, 17],
  8: [19, -2], 9: [1, 13], 10: [16, -15], 11: [4, 10], 13: [0, -13],
};

function worldMap() {
  const inset = 8;
  const left = mapArea.left + inset;
  const right = mapArea.right - inset;
  const top = mapArea.top + 32;
  const bottom = top + 96;
  const project = (lat, lon) => [left + (lon + 170) * (right - left) / 350, top + (72 - lat) * (bottom - top) / 127];
  const graticuleColor = '#334159';
  const graticule = [-120, -60, 0, 60, 120].map((lon) => {
    const [x] = project(0, lon);
    return line(x, top, x, bottom, graticuleColor, 0.6);
  }).join('') + [-30, 0, 30, 60].map((lat) => {
    const [, y] = project(lat, 0);
    return line(left, y, right, y, graticuleColor, 0.6);
  }).join('');
  const continents = land.map((coast) => {
    const points = coast.map(([lon, lat]) => project(lat, lon).map((value) => value.toFixed(2)).join(',')).join(' ');
    return element('polygon', { points, fill: '#647f83' });
  }).join('');

  const pinRadius = 8.25;
  const pinStroke = 0.9;
  const pinEdge = pinRadius + pinStroke / 2;
  const pins = [...heroes, ...grid].map(({ id, pin: [lat, lon] }) => {
    const [originX, originY] = project(lat, lon);
    const [dx, dy] = pinOffsets[id] ?? [0, 0];
    return { id, originX, originY, x: originX + dx, y: originY + dy, offset: dx !== 0 || dy !== 0 };
  });
  const pinLabel = { size: 11.5, bold: true, anchor: 'middle', fill: '#fff' };
  for (const [index, { id, x, y }] of pins.entries()) {
    assert(x - pinEdge >= left && x + pinEdge <= right
      && y - pinEdge >= mapArea.top + 24 && y + pinEdge <= bottom,
    `Map pin ${id} extends outside the map artwork`);
    assert(estimate(String(id), pinLabel) <= 2 * pinRadius, `Map pin ${id} label is too wide`);
    for (const other of pins.slice(index + 1)) {
      assert(Math.hypot(x - other.x, y - other.y) >= 2 * pinEdge, `Map pins ${id} and ${other.id} overlap`);
    }
  }
  const leaders = pins.filter(({ offset }) => offset).map(({ x, y, originX, originY }) =>
    line(originX, originY, x, y, '#e3d8ba', 0.75) + circle(originX, originY, 1.05, '#e3d8ba')).join('');
  const markers = pins.map(({ id, x, y }) => circle(x, y, pinRadius, red, outline(light, pinStroke))
    + text(x, y + 4, id, pinLabel)).join('');

  return rect(mapArea.left, mapArea.top, mapWidth, mapArea.bottom - mapArea.top, ink)
    + text(left, mapArea.top + 15, 'WHERE IT HAPPENED', { ...sectionStyle, size: 11.25, tracking: 0.95, fill: light })
    + line(left, mapArea.top + 21, right, mapArea.top + 21, '#55647a', 0.75)
    + graticule + continents + leaders + markers
    + line(left, mapArea.bottom - 24, right, mapArea.bottom - 24, '#55647a', 0.75)
    + text(left, mapArea.bottom - 9, 'pins = story numbers', { size: 11, fill: '#e3d8ba' });
}

function briefsBand() {
  const left = briefsArea.left;
  const gap = 10;
  const columnWidth = (right - left - gap) / 2;
  const divider = left + columnWidth + gap / 2;
  const columnLength = Math.ceil(also.length / 2);
  const columns = [also.slice(0, columnLength), also.slice(columnLength)];
  const firstBaseline = detailsTop + 26;
  const leading = 10.7;
  const bodyStyle = { size: 11 };
  return sectionTitle(left, detailsTop + detailsHeadingOffset, 'ALSO ON SUNDAY 22 NOVEMBER')
    + line(left, detailsTop + detailsRuleOffset, right, detailsTop + detailsRuleOffset)
    + line(divider, firstBaseline - bodyStyle.size + 3, divider, detailsBottom)
    + columns.map((entries, column) => {
      const x = left + column * (columnWidth + gap);
      return entries.map(({ region, text: description }, index) => {
        const id = heroes.length + grid.length + column * columnLength + index + 1;
        const y = firstBaseline + index * leading;
        const brief = { name: `Brief ${id}`, left: x, right: x + columnWidth,
          top: y - bodyStyle.size, bottom: y + bodyStyle.size / 4 };
        for (const area of [mapArea, dateCheckArea, footerArea]) {
          assertNoOverlap(brief, area);
        }
        const prefix = `${region} ·`;
        const regionStyle = { ...bodyStyle, bold: true, fill: regionColors[region] };
        const regionX = x + 18;
        const bodyX = regionX + Math.ceil(estimate(prefix, regionStyle)) + 3;
        return text(x + 14, y, id, { ...bodyStyle, bold: true, anchor: 'end', fill: muted })
          + text(regionX, y, prefix, regionStyle)
          + paragraph(bodyX, y, description, x + columnWidth - bodyX - 2, 1, 0,
            bodyStyle, `brief ${id}`, bodyStyle.size);
      }).join('');
    }).join('');
}

function dateCheckBox() {
  const dateTextX = margin + 101;
  const dateTextWidth = right - dateTextX - 9;
  const utcRule = fit(day.utcRule, dateTextWidth, 2, { size: 11.25, bold: true }, 'UTC rule', 11);
  const utcBaseline = dateTop + 11.5;
  const dateLeading = 11.25;
  const lastUtcBaseline = utcBaseline + (utcRule.lines.length - 1) * dateLeading;
  const rowOffsets = [12, 23.25, 34.5, 45.75];
  const columns = 4;
  const gridInset = 11.25;
  const gutter = 11.5;
  const gridWidth = width - 2 * gridInset;
  const columnWidth = (gridWidth - (columns - 1) * gutter) / columns;
  const itemStyle = { size: 10.75 };
  const whenStyle = { ...itemStyle, bold: true, fill: red };
  const footBaseline = lastUtcBaseline + rowOffsets.at(-1) + 11.5;
  const foot = fit(dateCheckFoot, gridWidth, 1,
    { size: 10.25, italic: true }, 'date-check footnote', 10);

  // Containment in the box also keeps this text within the checked section bounds.
  const assertDateBounds = (y, style, label) => {
    assert(y - style.size >= dateCheckArea.top + dateBorder
      && y + style.size / 4 <= dateCheckArea.bottom - dateBorder,
    `${label} extends outside the date-check box`);
  };
  assert.equal(dateCheck.length, columns * rowOffsets.length, 'Date check must fill the grid');
  const cells = dateCheck.map(({ item, when }, index) => {
    const column = Math.floor(index / rowOffsets.length);
    const row = index % rowOffsets.length;
    const x = margin + gridInset + column * (columnWidth + gutter);
    const y = lastUtcBaseline + rowOffsets[row];
    const label = `date-check entry ${index + 1}`;
    const prefix = `${item} `;
    assert(estimate(prefix, itemStyle) + estimate(when, whenStyle) <= columnWidth,
      `Text exceeds the space for ${label}: ${prefix}${when}`);
    assertDateBounds(y, itemStyle, label);
    const time = element('tspan', { fill: whenStyle.fill, 'font-weight': 700 }, escape(when));
    return text(x, y, prefix, itemStyle, time);
  }).join('');
  assertDateBounds(footBaseline, foot.style, 'Date-check footnote');
  return rect(margin + 0.5, dateTop, width - 1, dateHeight, 'none', outline(red, dateBorder))
    + text(margin + 9, utcBaseline, 'DATE CHECK', { size: 11.5, fill: red, bold: true, tracking: 0.75 })
    + linesOfText(dateTextX, utcBaseline, utcRule, dateLeading)
    + cells
    + linesOfText(margin + gridInset, footBaseline, foot, 0);
}

function footer() {
  const noteHeight = 24;
  const noteInset = 9;
  const noteStyle = { font: 'Adwaita Sans', size: 11, bold: true };
  const sourcesBaseline = noteTop + noteHeight + 7.75;
  const legendBaseline = sourcesBaseline + 9.5;
  const legend = Object.entries(statuses).map(([status, { ink: color, meaning }], index) => {
    const legendX = margin + index * (width / 4);
    const style = { size: 8.9, bold: true, fill: color, tracking: 0.45 };
    return text(legendX, legendBaseline, status, style)
      + text(legendX + Math.ceil(estimate(status, style)) + 5, legendBaseline, `· ${meaning}`, { size: 9.1, fill: muted });
  }).join('');
  return dateCheckBox()
    + rect(margin, noteTop, width, noteHeight, '#ede8dc', outline(rule, noteBorder))
    + paragraph(margin + noteInset, noteTop + 9.75, judgeNote, width - 2 * noteInset, 2, 11.25,
      noteStyle, 'judge note', 11)
    + paragraph(margin, sourcesBaseline, sources, width, 1, 0,
      { size: 9.2, italic: true, fill: muted }, 'sources')
    + legend;
}

const sections = [
  { name: 'masthead', top: margin, bottom: mastheadRuleY + 0.5 },
  { name: 'numbers band', top: numbersTop, bottom: numbersTop + numbersHeight },
  { name: 'complete day bar', top: completeTop, bottom: regionStripTop },
  { name: 'region strip', top: regionStripTop, bottom: timelineTop },
  { name: 'timeline', top: timelineTop, bottom: heroTop },
  { name: 'heroes', top: heroTop, bottom: heroTop + heroHeight },
  { name: 'story grid', top: gridTop, bottom: gridTop + gridRowStep + gridHeight },
  mapArea, briefsArea, dateCheckArea, footerArea,
].map((area) => ({ left: margin, right, ...area }));
for (const [index, section] of sections.entries()) {
  for (const other of sections.slice(index + 1)) assertNoOverlap(section, other);
}

const stipple = element('pattern', { id: 'stipple', width: 7, height: 7, patternUnits: 'userSpaceOnUse' },
  circle(1, 1, 0.5, ink, { opacity: 0.23 }) + circle(4.5, 4.5, 0.4, light, { opacity: 0.45 }));
const svg = element('svg', { xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: `0 0 ${size} ${size}` },
  [element('title', {}, escape(day.date)), element('defs', {}, stipple), band(size, size, paper),
    masthead(), numbersBand(), completeBand(), regionStrip(), timelineBand(), heroes.map(heroCard).join('\n'),
    grid.map(gridCard).join('\n'), worldMap(), briefsBand(), line(margin, detailsTop, right, detailsTop, ink, 1.5),
    footer()].join('\n'));

const build = new URL('./build/', import.meta.url);
mkdirSync(build, { recursive: true });
const temporary = mkdtempSync(fileURLToPath(new URL('render-', build)));
try {
  const page = join(temporary, 'page.svg');
  const fullColor = join(temporary, 'full-color.png');
  const indexed = join(temporary, 'indexed.png');
  writeFileSync(page, `${svg}\n`);
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), page, '-o', fullColor], { stdio: 'inherit' });

  const paletteFilter = 'split[image][colors];'
    + '[colors]palettegen=stats_mode=full:max_colors=256:reserve_transparent=0[palette];'
    + '[image][palette]paletteuse=dither=none';
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-filter_complex_threads', '1', '-threads', '1', '-i', fullColor,
    '-filter_complex', paletteFilter, '-frames:v', '1', '-pix_fmt', 'pal8', '-pred', 'mixed',
    '-compression_level', '9', '-threads', '1', indexed,
  ], { stdio: 'inherit' });

  const before = statSync(fullColor).size;
  const after = statSync(indexed).size;
  renameSync(page, new URL('page.svg', build));
  renameSync(indexed, new URL('./entry.png', import.meta.url));
  console.log(`PNG size: ${before} bytes before quantization, ${after} bytes after`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
if (shrinkLog.length) console.log(`Reduced text sizes:\n${shrinkLog.join('\n')}`);
console.log(`Region counts: ${regions.map((region) => `${region} ${regionCounts[region]}`).join(', ')} (${storyCount} total)`);
