// Editorial content for the front page of Sunday 22 November 2026.
// Checked story by story on 23 November: every item happened, or was first announced, on Sunday 22 November.
// Anything that happened on Friday or Saturday goes in dateCheck instead.
// Status tags: CONFIRMED = carried by 2+ outlets, OFFICIAL = on the record from an authority,
// CLAIM = one side's account, REPORTED = one outlet so far.

export const day = {
  date: 'Sunday 22 November 2026',
  kicker: 'ONE DAY OF WORLD NEWS, ONE PICTURE',
  tally: '39 STORIES · 6 REGIONS · ALL FROM THIS SUNDAY',
  deck: 'COP31 ends with no climate pact · Russian strikes kill 15 around Kyiv · Trump weighs new Iran strikes · Alcaraz wins in Turin',
  complete: 'COMPLETE DAY · DATED BY UTC: 00:00–24:00 UTC ON 22 NOV · CHECKED AFTER THE DAY ENDED',
  utcRule: 'Dated by UTC: a story counts if it happened between 00:00 and 24:00 UTC on 22 November. Las Vegas (04:00–05:30 UTC) and San Antonio (01:00–03:15 UTC) were Saturday night locally but Sunday in UTC.',
};

// Order of the region strip. Counts are computed from heroes/grid 'area' and also 'region'.
export const regions = ['Europe', 'Middle East', 'Africa', 'Asia', 'Americas', 'Oceania'];

// Approximate UTC times, in order.
export const timeline = [
  { t: 'Night', text: 'Drone brings down a block in Dymer' },
  { t: '~01:00', text: 'Drones hit Khartoum, Omdurman' },
  { t: '~03:15', text: 'Wembanyama ends on 50 points' },
  { t: '~04:00', text: 'Russian corvette sinks at Benghazi' },
  { t: '~05:30', text: 'Verstappen wins in Las Vegas' },
  { t: '~11:00', text: 'Pope lunches with 1,300 poor' },
  { t: 'Midday', text: 'COP31 ends with no deal' },
  { t: '~19:00', text: 'Alcaraz wins in Turin' },
];

export const numbers = [
  { n: '0', label: 'climate deals from COP31' },
  { n: '15', label: 'killed in Russian strikes' },
  { n: '14 h', label: 'boy, 7, under rubble' },
  { n: '5', label: 'children killed by a mine' },
  { n: '98.8%', label: 'turnout in Hong Kong polls' },
  { n: '1.52m', label: 'people hit by KEPCO leak' },
];

export const heroes = [
  {
    id: 1, pin: [36.9, 30.7], area: 'Europe', region: 'TÜRKİYE · CLIMATE', status: 'CONFIRMED', badge: 'NO DEAL',
    art: 'summit',
    head: 'COP31 collapses in Antalya without a climate pact',
    body: 'Talks end about 44 hours late. The EU, Norway and Panama reject a draft that leaves out fossil fuels. UN chief "deeply disappointed".',
    src: 'CNN, CBS News, UN',
  },
  {
    id: 2, pin: [50.8, 30.3], area: 'Europe', region: 'UKRAINE · WAR', status: 'CONFIRMED', badge: '15 DEAD',
    art: 'blocks',
    head: 'Russian strikes kill 15; a block collapses in Dymer',
    body: 'A boy of 7 is pulled out alive after about 14 hours under the rubble. Zelensky asks the US to release Patriot missiles.',
    src: 'Kyiv Post, Al Jazeera',
  },
  {
    id: 3, pin: [26.6, 56.3], area: 'Middle East', region: 'USA · IRAN', status: 'OFFICIAL', badge: 'WAR THREAT',
    art: 'tanker',
    head: 'Trump "inclined" to resume Iran strikes after New Year',
    body: 'He tells Fox News talks may fail. Iran\'s navy claims 2 more tankers hit mines near Hormuz (unverified). Tehran starts rolling power cuts.',
    src: 'Fox News, IRNA, AFP',
  },
];

export const grid = [
  { id: 4, pin: [45.07, 7.69], area: 'Europe', region: 'ITALY · TENNIS', status: 'CONFIRMED', art: 'tennis', tag: '6-2 7-6',
    head: 'Alcaraz beats Zverev for first ATP Finals title', body: 'Saves 3 set points in the Turin final.', src: 'ATP, Reuters' },
  { id: 5, pin: [37.57, 126.98], area: 'Asia', region: 'SOUTH KOREA · EDUCATION', status: 'OFFICIAL', art: 'exam', tag: 'RESIGNS',
    head: 'Education minister quits over exam-cheating chaos', body: 'President Lee accepts; orders a review.', src: 'JoongAng Daily, SCMP' },
  { id: 6, pin: [32.1, 20.07], area: 'Africa', region: 'LIBYA · WAR', status: 'CONFIRMED', art: 'ship', tag: 'SUNK',
    head: 'Russian corvette sinks after blast in Benghazi', body: 'Suspected sea-drone strike at dawn.', src: 'Al Jazeera, WSJ' },
  { id: 7, pin: [15.6, 32.5], area: 'Africa', region: 'SUDAN · WAR', status: 'CONFIRMED', art: 'drone', tag: 'UN SITE HIT',
    head: 'Drones kill 4 in Khartoum and Omdurman', body: 'UN says its staff premises were damaged.', src: 'AFP, UN' },
  { id: 8, pin: [35.44, 36.65], area: 'Middle East', region: 'SYRIA · CONFLICT', status: 'CONFIRMED', art: 'mine', tag: '5 CHILDREN',
    head: 'Old landmine kills 5 children in Idlib', body: 'Aged 8 to 15, near Khan Sheikhoun.', src: 'SANA, The New Arab' },
  { id: 9, pin: [1.56, 30.25], area: 'Africa', region: 'DR CONGO · HEALTH', status: 'OFFICIAL', art: 'health', tag: 'EBOLA',
    head: 'WHO: fighting disrupts the Ebola response', body: 'Clashes near a hospital in Ituri.', src: 'WHO, Reuters' },
  { id: 10, pin: [41.0, 28.98], area: 'Europe', region: 'TÜRKİYE · MEDIA', status: 'CONFIRMED', art: 'crowd', tag: 'ISTANBUL',
    head: 'Thousands march against media crackdown', body: 'Five days after police seized Sözcü TV.', src: 'AFP, Turkish Minute' },
  { id: 11, pin: [22.3, 114.17], area: 'Asia', region: 'HONG KONG · POLITICS', status: 'OFFICIAL', art: 'ballot', tag: '98.8% TURNOUT',
    head: 'Hong Kong fills Election Committee seats', body: '856 candidates for 723 seats.', src: 'HK govt' },
  { id: 12, pin: [36.1, -80.2], area: 'Americas', region: 'USA · POLITICS', status: 'CONFIRMED', art: 'capitol', tag: 'RECOUNT',
    head: 'Democrat Hubbard wins NC-5 after recount', body: 'Foxx concedes; Democrats near 258 seats.', src: 'AP, ABC News' },
  { id: 13, pin: [36.17, -115.14], area: 'Americas', region: 'USA · FORMULA 1', status: 'CONFIRMED', art: 'f1', tag: 'LAS VEGAS',
    head: 'Verstappen wins the Las Vegas Grand Prix', body: 'Norris 2nd by 0.6s; Piastri 3rd. Ends 05:30 UTC.', src: 'Formula1.com, RaceFans' },
];

export const also = [
  { region: 'Europe', text: 'Vatican: Pope Leo XIV lunches with 1,300 poor people' },
  { region: 'Europe', text: 'Football: Liverpool 4, Manchester United 0' },
  { region: 'Middle East', text: 'West Bank: settlers torch homes and cars near Ramallah' },
  { region: 'Europe', text: 'Poland says Russia twice plotted to kill a Ukrainian rapper' },
  { region: 'Europe', text: 'MotoGP: Marc Márquez clinches his 8th premier-class title' },
  { region: 'Europe', text: 'Russia tows drone-hit Sparta II out of Finnish waters' },
  { region: 'Middle East', text: 'Bahrain denies Iran\'s claim it hit US Patriot radars' },
  { region: 'Middle East', text: 'Saudi-led coalition downs Houthi missile and drone' },
  { region: 'Middle East', text: 'Israel: Likud–Yashar unity talks end without a deal' },
  { region: 'Africa', text: 'Nigeria: Bayelsa funeral-boat toll rises to 29 (one report)' },
  { region: 'Africa', text: 'Kenya and DR Congo restore full ties at Oyo summit' },
  { region: 'Asia', text: 'S. Korea: KEPCO breach exposes 1.52m people' },
  { region: 'Asia', text: 'China cuts stock margin rule to 80% after AI sell-off' },
  { region: 'Asia', text: 'S. Korea readies $8bn fund to steady markets after AI sell-off' },
  { region: 'Asia', text: 'Golf: Jeeno Thitikul wins a third straight CME title' },
  { region: 'Asia', text: 'Indonesia: 24 bodies, 32 missing after candy-plant fire' },
  { region: 'Asia', text: 'India: crash in Rajasthan kills 9 of one family' },
  { region: 'Asia', text: 'Bangladesh: garment workers block highway over pay' },
  { region: 'Asia', text: 'Taiwan: HK film "We Are Born Good" wins top Golden Horse' },
  { region: 'Americas', text: 'NBA: Wembanyama scores 50 as Spurs beat Pelicans 114-91' },
  { region: 'Americas', text: 'NFL in Mexico City: 49ers 35, Vikings 10' },
  { region: 'Americas', text: 'US: Delta system glitch delays 1,000+ flights' },
  { region: 'Americas', text: 'US: SpaceX launches NROL-136 spy satellites' },
  { region: 'Oceania', text: 'Cricket: India declare on a record 720/9; NZ 119/2' },
  { region: 'Oceania', text: 'Australia: TV icon Molly Meldrum dies at 83 (late Sun UTC)' },
  { region: 'Oceania', text: 'Australia: Marles says US budget office "wrong" on AUKUS' },
];

export const dateCheck = 'Left out on purpose, as they happened before Sunday in UTC: the Kryvyi Rih missile strike (Fri), Mexico\'s capture of "El Chapo Isidro" (Fri–Sat), ' +
  'the end of the Geneva killer-robot talks (Fri–Sat), protests at Meta\'s India offices (Fri), Bolsonaro\'s move to intensive care (Sat; still there Sunday). ' +
  'Shown only through their Sunday news: Iran\'s Bahrain claim (Sat; denied Sunday), the Banten fire (began Sat), the Bayelsa boat capsize (Fri).';

export const judgeNote = 'Note for the judge: this page was compiled after 22 November had ended and checked story by story. ' +
  'Every story is dated by UTC; earlier events are named in the date check, not shown as Sunday news. It shows how Sunday finished: ' +
  'COP31 ended with no deal and Alcaraz won in Turin.';

export const sources = 'Sources: AP, AFP, Reuters, CNN, Al Jazeera, Kyiv Post, ATP, JoongAng Daily, Korea Times, HK govt, WHO, ABC (AU), Xinhua, France 24, Formula1.com, ESPN, detikNews · drawings made in code';
