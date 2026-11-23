import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { also, dateCheck, day, grid, heroes, judgeNote, numbers, sources, timeline } from './stories.mjs';

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

function text(x, y, value, options = {}) {
  const { font = sans, size = 12, bold = false, weight = bold ? 700 : 400, italic = false,
    fill = ink, anchor = 'start', tracking = 0 } = options;
  return element('text', {
    x, y, fill, 'font-family': font, 'font-size': size, 'font-weight': weight,
    'font-style': italic ? 'italic' : 'normal', 'text-anchor': anchor, 'letter-spacing': tracking,
  }, escape(value));
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

function fit(value, limit, maxLines, style, label) {
  const initialSize = style.size;
  for (let step = 0; step <= 16; step++) {
    const candidate = Number((initialSize - step * 0.25).toFixed(2));
    const adjusted = { ...style, size: candidate };
    const lines = wrap(value, limit, adjusted);
    if (lines.length <= maxLines && lines.every((row) => estimate(row, adjusted) <= limit)) {
      if (candidate < initialSize) shrinkLog.push(`${label}: ${initialSize} → ${candidate} px`);
      return { lines, style: adjusted };
    }
  }
  throw new Error(`Text exceeds the space for ${label}: ${value}`);
}

function paragraph(x, y, value, limit, maxLines, leading, style, label) {
  const fitted = fit(value, limit, maxLines, style, label);
  return fitted.lines.map((row, index) => text(x, y + index * leading, row, fitted.style)).join('');
}

const regionColors = {
  Europe: '#355284', 'Middle East': '#8c3c26', Africa: '#755317', Asia: '#21634f',
  Americas: '#68456d', Oceania: '#23636e', World: '#4d5363',
};
const storyRegions = [
  'Middle East', 'Europe', 'Middle East', 'Europe', 'Americas', 'Oceania', 'Asia',
  'Africa', 'Africa', 'Asia', 'Africa', 'Middle East', 'Asia',
];

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
  const color = regionColors[storyRegions[story.id - 1]];
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
  tennis() {
    const chalk = '#e9e4c5';
    return band(192, 58, '#527b70') + path('M11 49L33 9H150L178 49Z', '#355866', outline(chalk, 1.4))
      + path('M23 29H165M94 9V49M44 9L29 49M138 9L158 49', 'none', outline(chalk))
      + path('M21 31V24H167V31M28 27H160', 'none', outline('#c3d9ce'))
      + circle(62, 20, 6, '#f1cb66', outline('#fff0b1'))
      + path('M60 14Q57 19 63 25', 'none', outline('#fff0b1'));
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
};

function artPanel(story, x, y, w, h) {
  return element('svg', { x, y, width: w, height: h, viewBox: `0 0 ${w} ${h}`, overflow: 'hidden' }, illustrations[story.art]());
}

function masthead() {
  const strip = { size: 11, bold: true, tracking: 1.4 };
  const dateStyle = { font: serif, size: 100, bold: true, anchor: 'middle' };
  const scale = Math.min(1, width / estimate(day.date, dateStyle));
  return text(margin, 24, day.kicker, { ...strip, fill: red })
    + text(right, 24, day.tally, { ...strip, anchor: 'end' })
    + group(text(0, 112, day.date, dateStyle), `translate(${size / 2} 0) scale(${scale} 1)`)
    + line(margin, 138, right, 138, ink, 1.5) + line(margin, 142, right, 142, ink)
    + rect(margin, 148, width, 20, red)
    + text(size / 2, 162, day.complete, { size: 11.4, bold: true, fill: light, tracking: 1.05, anchor: 'middle' });
}

function sectionTitle(x, y, label) {
  return text(x, y, label, { size: 12.6, bold: true, tracking: 1.25, fill: red });
}

function timelineBand() {
  const colWidth = width / timeline.length;
  return sectionTitle(margin, 185, 'THE DAY IN UTC') + line(145, 181, right, 181)
    + timeline.map(({ t, text: description }, index) => {
      const x = margin + index * colWidth;
      const inset = index === 0 ? 0 : 9;
      return (index === 0 ? '' : line(x, 193, x, 228))
        + text(x + inset, 204, t, { size: 13.1, bold: true })
        + paragraph(x + inset, 217, description, colWidth - inset - 6, 2, 11.1,
          { size: 11.5 }, `timeline ${t}`);
    }).join('');
}

function heroCard(story, index) {
  const w = 324;
  const h = 237;
  const x = margin + index * 336;
  const y = 235;
  const inset = 9;
  const contents = w - 2 * inset;
  const left = x + inset;
  const badge = { size: 11.2, bold: true, tracking: 0.8, fill: light };
  return rect(x + 0.5, y + 0.5, w - 1, h - 1, '#faf6ed', outline(rule))
    + artPanel(story, x, y, w, 110)
    + rect(left, y + 8, Math.ceil(estimate(story.badge, badge) + 15), 19, red)
    + text(left + 7, y + 21, story.badge, badge)
    + storyLabel(left, y + 125, story, contents - 95, true)
    + statusPill(x + w - inset, y + 117, story.status)
    + paragraph(left, y + 150, story.head, contents - 2, 2, 22.5,
      { font: serif, bold: true, size: 23 }, `${story.id} headline`)
    + paragraph(left, y + 190, story.body, contents - 2, 3, 12.4,
      { size: 12.2 }, `${story.id} body`)
    + paragraph(left, y + 229, story.src, contents, 1, 0,
      { size: 10.5, italic: true, fill: muted }, `${story.id} source`);
}

function gridCard(story, index) {
  const w = 192;
  const h = 131;
  const x = margin + (index % 5) * 201;
  const y = 478 + Math.floor(index / 5) * 137;
  const left = x + 7;
  const contents = w - 14;
  const tagStyle = { size: 10.4, bold: true, tracking: 0.65, fill: light, anchor: 'end' };
  const tagWidth = Math.ceil(estimate(story.tag, tagStyle) + 12);
  return rect(x + 0.5, y + 0.5, w - 1, h - 1, '#faf6ed', outline(rule))
    + artPanel(story, x, y, w, 58)
    + statusPill(x + w - 5, y + 4, story.status, true)
    + rect(x + w - tagWidth, y + 42, tagWidth, 16, ink)
    + text(x + w - 6, y + 53.5, story.tag, tagStyle)
    + storyLabel(left, y + 69, story, contents)
    + paragraph(left, y + 89, story.head, contents - 2, 2, 15.6,
      { font: serif, bold: true, size: 16.1 }, `${story.id} headline`)
    + paragraph(left, y + 117, story.body, contents - 2, 1, 0,
      { size: 11.2 }, `${story.id} body`)
    + paragraph(left, y + 127.2, story.src, contents, 1, 0,
      { size: 9.2, italic: true, fill: muted }, `${story.id} source`);
}

function numbersBand() {
  const x = margin + 8;
  const y = 756;
  const cellWidth = 109;
  return rect(margin, y, 228, 162, '#eee7d8') + sectionTitle(x, y + 17, 'THE DAY IN NUMBERS')
    + line(x, y + 23, 234, y + 23)
    + numbers.map(({ n, label }, index) => {
      const column = index % 2;
      const left = x + column * cellWidth;
      const baseline = y + 48 + Math.floor(index / 2) * 45;
      return text(left, baseline, n, { size: 26, bold: true, font: serif })
        + paragraph(left, baseline + 12.5, label, cellWidth, 2, 11.5,
          { size: 11.6 }, `number ${n} label`);
    }).join('');
}

function briefsBand() {
  const left = 254;
  const columns = 2;
  const gap = 12;
  const colWidth = (right - left - gap) / columns;
  const divider = left + colWidth + gap / 2;
  const columnLength = Math.ceil(also.length / columns);
  return sectionTitle(left, 773, 'ALSO ON SUNDAY 22 NOVEMBER')
    + line(left, 779, right, 779)
    + line(divider, 785, divider, 918)
    + also.map(({ region, text: description }, index) => {
      const id = heroes.length + grid.length + index + 1;
      const column = Math.floor(index / columnLength);
      const x = left + column * (colWidth + gap);
      const y = 794 + (index % columnLength) * 13.45;
      const prefix = `${region} ·`;
      const regionStyle = { size: 11.5, bold: true, fill: regionColors[region] };
      const regionX = x + 20;
      const bodyX = regionX + Math.ceil(estimate(prefix, regionStyle)) + 3;
      const bodyRight = column === 0 ? divider - 1 : right - 2;
      return text(x + 13, y, id, { size: 10.5, bold: true, anchor: 'end', fill: muted })
        + text(regionX, y, prefix, regionStyle)
        + paragraph(bodyX, y, description, bodyRight - bodyX, 1, 0, { size: 11.5 }, `brief ${id}`);
    }).join('');
}

function footer() {
  const legendBaseline = 1018;
  const noteInset = 9;
  const noteStyle = { font: 'Adwaita Sans', size: 12, weight: 600, fill: ink };
  const legend = Object.entries(statuses).map(([status, { ink: color, meaning }], index) => {
    const legendX = margin + index * (width / 4);
    const style = { size: 8.9, bold: true, fill: color, tracking: 0.45 };
    return text(legendX, legendBaseline, status, style)
      + text(legendX + Math.ceil(estimate(status, style)) + 5, legendBaseline, `· ${meaning}`, { size: 9.1, fill: muted });
  }).join('');
  return rect(margin + 0.5, 923.5, width - 1, 29, 'none', outline(red))
    + text(margin + 9, 941.5, 'DATE CHECK', { size: 11, fill: red, bold: true, tracking: 0.75 })
    + paragraph(margin + 93, 935.5, dateCheck, width - 102, 2, 11.1, { size: 11.1 }, 'date check')
    + rect(margin, 955, width, 41, '#ede8dc', outline(rule, 0.65))
    + paragraph(margin + noteInset, 972, judgeNote, width - 2 * noteInset, 2, 13.5, noteStyle, 'judge note')
    + paragraph(margin, 1005, sources, width, 1, 0, { size: 9.2, italic: true, fill: muted }, 'sources')
    + legend;
}

const stipple = element('pattern', { id: 'stipple', width: 7, height: 7, patternUnits: 'userSpaceOnUse' },
  circle(1, 1, 0.5, ink, { opacity: 0.23 }) + circle(4.5, 4.5, 0.4, light, { opacity: 0.45 }));
const svg = element('svg', { xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: `0 0 ${size} ${size}` },
  [element('title', {}, escape(day.date)), element('defs', {}, stipple), band(size, size, paper),
    masthead(), timelineBand(), heroes.map(heroCard).join('\n'), grid.map(gridCard).join('\n'),
    numbersBand(), briefsBand(), line(margin, 756, right, 756, ink, 1.5), footer()].join('\n'));

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
