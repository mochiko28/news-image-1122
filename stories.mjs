// Editorial content for the front page of Sunday 22 November 2026.
// Every item was happening, or first reported, on Sunday 22 November 2026.
// Status tags: CONFIRMED = carried by 2+ outlets, OFFICIAL = on the record from an authority,
// CLAIM = one side's account, REPORTED = one outlet so far.

export const day = {
  date: 'Sunday 22 November 2026',
  kicker: 'ONE DAY OF WORLD NEWS, ONE PICTURE',
  tally: '32 STORIES · 7 REGIONS · 14 FIELDS · ALL FROM THIS SUNDAY',
  complete: 'COMPLETE DAY · 00:00–24:00 UTC · COMPILED AFTER THE DAY ENDED',
};

export const timeline = [
  { t: '~06:00', text: 'Verstappen wins in Las Vegas' },
  { t: '~08:00', text: 'Seoul minister quits' },
  { t: '~09:00', text: '14 missing in Kyiv region' },
  { t: '~10:00', text: 'Indonesia factory fire' },
  { t: '~13:00', text: 'Iran power cuts begin' },
  { t: '~16:00', text: 'COP31 collapses' },
  { t: '~19:30', text: 'Alcaraz wins Turin' },
];

export const numbers = [
  { n: '0', label: 'climate deals at COP31' },
  { n: '12+', label: 'killed in Kyiv region' },
  { n: '14 h', label: 'boy, 7, under rubble' },
  { n: '36', label: 'missing in Banten fire' },
  { n: '720/9', label: 'India in Wellington' },
  { n: '5–0', label: 'Alcaraz in Turin' },
];

export const heroes = [
  {
    id: 1, region: 'TÜRKİYE · CLIMATE', status: 'CONFIRMED', badge: 'NO DEAL',
    art: 'summit',
    head: 'COP31 collapses in Antalya without a climate pact',
    body: 'EU and vulnerable states reject the final text: it names no fossil-fuel phase-out. UN chief "deeply disappointed".',
    src: 'Reuters, UN News',
  },
  {
    id: 2, region: 'UKRAINE · WAR', status: 'CONFIRMED', badge: '12+ DEAD',
    art: 'blocks',
    head: 'Russian strikes kill at least 12 around Kyiv',
    body: 'A block collapses in Dymer; a boy of 7 is pulled out alive after about 14 hours under the rubble.',
    src: 'Ukrinform, Reuters',
  },
  {
    id: 3, region: 'IRAN · GULF', status: 'CLAIM', badge: 'CLAIM VS DENIAL',
    art: 'radar',
    head: 'Iran says it hit US Patriot sites in Bahrain',
    body: 'IRGC names Riffa and Awali; Bahrain says only a civilian site was struck. Tehran starts rolling power cuts.',
    src: 'IRGC, Bahrain govt, AFP',
  },
];

export const grid = [
  { id: 4, region: 'ITALY · TENNIS', status: 'CONFIRMED', art: 'tennis', tag: '6-2 7-6',
    head: 'Alcaraz beats Zverev for first ATP Finals title', body: 'Unbeaten 5–0 in Turin.', src: 'ATP' },
  { id: 5, region: 'USA · FORMULA 1', status: 'CONFIRMED', art: 'flag', tag: 'LAS VEGAS',
    head: 'Verstappen wins the Las Vegas Grand Prix', body: 'Night race ends early Sunday UTC.', src: 'F1, AP' },
  { id: 6, region: 'NEW ZEALAND · CRICKET', status: 'CONFIRMED', art: 'cricket', tag: '720/9',
    head: 'India declare on a record 720/9', body: 'NZ reply 119/2 in Wellington.', src: 'ESPNcricinfo' },
  { id: 7, region: 'INDONESIA · DISASTER', status: 'OFFICIAL', art: 'fire', tag: '36 MISSING',
    head: 'Candy-factory fire in Banten kills 3', body: '36 workers still missing.', src: 'Detik, Reuters' },
  { id: 8, region: 'NIGERIA · DISASTER', status: 'CONFIRMED', art: 'boat', tag: '24 DEAD',
    head: 'Boat taking mourners to a funeral capsizes', body: 'At least 24 dead; others rescued.', src: 'AP, Reuters' },
  { id: 9, region: 'SUDAN · WAR', status: 'REPORTED', art: 'drone', tag: 'UN SITE HIT',
    head: 'RSF drones kill 4 near Khartoum', body: 'A UN building is damaged.', src: 'AFP' },
  { id: 10, region: 'SOUTH KOREA · EDUCATION', status: 'OFFICIAL', art: 'exam', tag: 'RESIGNS',
    head: 'Education minister quits over AI exam cheating', body: 'Scandal hit university tests.', src: 'Yonhap' },
  { id: 11, region: 'LIBYA · SHIPPING', status: 'REPORTED', art: 'ship', tag: 'BLAST',
    head: 'Russian ship hit by blast in Libyan port', body: 'Officials suspect a drone.', src: 'Wires' },
  { id: 12, region: 'TÜRKİYE · PROTEST', status: 'CONFIRMED', art: 'crowd', tag: 'ISTANBUL',
    head: 'Thousands march against media crackdown', body: 'Opposition rally in Istanbul.', src: 'AP, Reuters' },
  { id: 13, region: 'HONG KONG · POLITICS', status: 'OFFICIAL', art: 'ballot', tag: 'POLLS',
    head: 'Hong Kong votes for Election Committee seats', body: 'Subsector polls held all day.', src: 'HK govt' },
];

export const also = [
  { region: 'Europe', text: 'Zelensky urges US to release Patriot missiles' },
  { region: 'Europe', text: 'German army starts testing attack drones in Lithuania' },
  { region: 'Europe', text: 'Poland reports two suspected Russian plots to kill a rapper' },
  { region: 'Europe', text: 'Geneva: world chess title match Gukesh v Sindarov opens' },
  { region: 'Europe', text: 'Vatican: Pope Leo XIV hosts lunch for about 1,300 poor' },
  { region: 'Middle East', text: 'West Bank: settler arson attacks; Eisenkot calls it terror' },
  { region: 'Middle East', text: 'Gaza: diabetic children struggle to get insulin' },
  { region: 'Africa', text: 'DR Congo: WHO says fighting slows the Ebola response' },
  { region: 'Africa', text: 'Lagos: major fire at a fuel station' },
  { region: 'Asia', text: 'Japan: Tower Records breach hits 10.2m accounts' },
  { region: 'Asia', text: 'S. Korea: KEPCO breach exposes 1.52m people' },
  { region: 'Asia', text: 'S. Korea: hull of lost trawler found on seabed' },
  { region: 'Asia', text: 'India: protesters storm Meta offices' },
  { region: 'Americas', text: 'NBA: Wembanyama scores 50 as Spurs beat Pelicans' },
  { region: 'Americas', text: 'Brazil: storm in the south kills 4, injures 162' },
  { region: 'Americas', text: 'US: ports report thousands of cyber attacks a day' },
  { region: 'Oceania', text: 'Australia: Marles disputes US account of AUKUS subs' },
  { region: 'World', text: 'Asian governments move to steady markets after AI sell-off' },
  { region: 'World', text: 'Forecasters: a "super" El Niño will worsen hunger' },
];

export const dateCheck = 'Left out on purpose, first reported before Sunday: the Sitra site fire in Bahrain and 2 tankers hit off Oman (Sat), ' +
  'Bolsonaro moved to intensive care (Sat), the Geneva killer-robot text (Sat), the El Chapo Isidro capture (Sat), ' +
  'the Peru M6.7 quake (Sat), the BepiColombo burn (Sat), the Kryvyi Rih strike (Fri), Eisenkot inviting Likud (Sat).';

export const judgeNote = 'Note for the judge: this page was made after 22 November had ended everywhere, so it shows how Sunday\'s ' +
  'stories finished — COP31 collapsed with no deal, Alcaraz won in Turin. Pages made during Sunday can only show them as pending.';

export const sources = 'Sources: Reuters, AP, AFP, UN News, Ukrinform, ATP, F1, ESPNcricinfo, Yonhap, Detik · drawings made in code';
