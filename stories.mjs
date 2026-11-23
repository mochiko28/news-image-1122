// Editorial content for the front page of Sunday 22 November 2026.
// Checked story by story on 23 November: every item happened, or was first announced, on Sunday 22 November.
// Anything that happened on Friday or Saturday goes in dateCheck instead.
// Status tags: CONFIRMED = carried by 2+ outlets, OFFICIAL = on the record from an authority,
// CLAIM = one side's account, REPORTED = one outlet so far.

export const day = {
  date: 'Sunday 22 November 2026',
  kicker: 'ONE DAY OF WORLD NEWS, ONE PICTURE',
  tally: '36 STORIES · 6 REGIONS · ALL FROM THIS SUNDAY',
  complete: 'COMPLETE DAY · 00:00–24:00 UTC · COMPILED AND CHECKED AFTER THE DAY ENDED',
};

// Approximate UTC times, in order.
export const timeline = [
  { t: 'Night', text: 'Drone brings down a block in Dymer' },
  { t: '~01:00', text: 'Drones hit Khartoum, Omdurman' },
  { t: '01–10', text: 'Hong Kong committee polls' },
  { t: '~04:00', text: 'Russian corvette sinks at Benghazi' },
  { t: '~11:00', text: 'Pope lunches with 1,300 poor' },
  { t: '12:23', text: 'SpaceX spy-satellite launch' },
  { t: 'Afternoon', text: 'COP31 ends with no deal' },
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
    id: 1, region: 'TÜRKİYE · CLIMATE', status: 'CONFIRMED', badge: 'NO DEAL',
    art: 'summit',
    head: 'COP31 collapses in Antalya without a climate pact',
    body: 'Talks end about 44 hours late. The EU, Norway and Panama reject a draft that leaves out fossil fuels. UN chief "deeply disappointed".',
    src: 'CNN, CBS News, UN',
  },
  {
    id: 2, region: 'UKRAINE · WAR', status: 'CONFIRMED', badge: '15 DEAD',
    art: 'blocks',
    head: 'Russian strikes kill 15; a block collapses in Dymer',
    body: 'A boy of 7 is pulled out alive after about 14 hours under the rubble. Zelensky asks the US to release Patriot missiles.',
    src: 'Kyiv Post, Al Jazeera',
  },
  {
    id: 3, region: 'USA · IRAN', status: 'OFFICIAL', badge: 'WAR THREAT',
    art: 'tanker',
    head: 'Trump "inclined" to resume Iran strikes after New Year',
    body: 'He tells Fox News talks may fail. Iran\'s navy claims 2 more tankers hit mines near Hormuz (unverified). Tehran starts rolling power cuts.',
    src: 'Fox News, IRNA, AFP',
  },
];

export const grid = [
  { id: 4, region: 'ITALY · TENNIS', status: 'CONFIRMED', art: 'tennis', tag: '6-2 7-6',
    head: 'Alcaraz beats Zverev for first ATP Finals title', body: 'Saves 3 set points in the Turin final.', src: 'ATP, Reuters' },
  { id: 5, region: 'SOUTH KOREA · EDUCATION', status: 'OFFICIAL', art: 'exam', tag: 'RESIGNS',
    head: 'Education minister quits over exam-cheating chaos', body: 'President Lee accepts; orders a review.', src: 'JoongAng Daily, SCMP' },
  { id: 6, region: 'LIBYA · WAR', status: 'CONFIRMED', art: 'ship', tag: 'SUNK',
    head: 'Russian corvette sinks after blast in Benghazi', body: 'Suspected sea-drone strike at dawn.', src: 'Al Jazeera, WSJ' },
  { id: 7, region: 'SUDAN · WAR', status: 'CONFIRMED', art: 'drone', tag: 'UN SITE HIT',
    head: 'Drones kill 4 in Khartoum and Omdurman', body: 'UN says its staff premises were damaged.', src: 'AFP, UN' },
  { id: 8, region: 'SYRIA · CONFLICT', status: 'CONFIRMED', art: 'mine', tag: '5 CHILDREN',
    head: 'Old landmine kills 5 children in Idlib', body: 'Aged 8 to 15, near Khan Sheikhoun.', src: 'SANA, The New Arab' },
  { id: 9, region: 'DR CONGO · HEALTH', status: 'OFFICIAL', art: 'health', tag: 'EBOLA',
    head: 'WHO: fighting disrupts the Ebola response', body: 'Clashes near a hospital in Ituri.', src: 'WHO, Reuters' },
  { id: 10, region: 'TÜRKİYE · MEDIA', status: 'CONFIRMED', art: 'crowd', tag: 'ISTANBUL',
    head: 'Thousands march against media crackdown', body: 'Five days after police seized Sözcü TV.', src: 'AFP, Turkish Minute' },
  { id: 11, region: 'HONG KONG · POLITICS', status: 'OFFICIAL', art: 'ballot', tag: '98.8% TURNOUT',
    head: 'Hong Kong fills Election Committee seats', body: '856 candidates for 723 seats.', src: 'HK govt' },
  { id: 12, region: 'USA · POLITICS', status: 'CONFIRMED', art: 'capitol', tag: 'RECOUNT',
    head: 'Democrat Hubbard wins NC-5 after recount', body: 'Foxx concedes; Democrats near 258 seats.', src: 'AP, ABC News' },
  { id: 13, region: 'NEW ZEALAND · CRICKET', status: 'CONFIRMED', art: 'cricket', tag: '720/9',
    head: 'India declare on a record 720/9', body: 'NZ reach 119/2 in Wellington.', src: 'Sunday Guardian, Dynamite News' },
];

export const also = [
  { region: 'Europe', text: 'Vatican: Pope Leo XIV lunches with 1,300 poor people' },
  { region: 'Europe', text: 'Geneva: Gukesh v Sindarov world chess match opens' },
  { region: 'Europe', text: 'Football: Liverpool 4, Manchester United 0' },
  { region: 'Middle East', text: 'West Bank: settlers torch homes and cars near Ramallah' },
  { region: 'Europe', text: 'Poland says Russia twice plotted to kill a Ukrainian rapper' },
  { region: 'Europe', text: 'MotoGP: Marc Márquez clinches his 8th premier-class title' },
  { region: 'Middle East', text: 'Saudi-led coalition downs Houthi missile and drone' },
  { region: 'Middle East', text: 'Syria destroys 400 million seized Captagon pills' },
  { region: 'Middle East', text: 'Israel: Likud–Yashar unity talks end without a deal' },
  { region: 'Africa', text: 'Kenya and DR Congo restore full ties at Oyo summit' },
  { region: 'Asia', text: 'S. Korea: KEPCO breach exposes 1.52m people' },
  { region: 'Asia', text: 'S. Korea: hull of missing trawler found; 7 still missing' },
  { region: 'Asia', text: 'S. Korea readies $8bn fund to steady markets after AI sell-off' },
  { region: 'Asia', text: 'Golf: Jeeno Thitikul wins a third straight CME title' },
  { region: 'Asia', text: 'India: crash in Rajasthan kills 9 of one family' },
  { region: 'Asia', text: 'Bangladesh: garment workers block highway over pay' },
  { region: 'Asia', text: 'Taiwan: HK film "We Are Born Good" wins top Golden Horse' },
  { region: 'Americas', text: 'NFL in Mexico City: 49ers 35, Vikings 10' },
  { region: 'Americas', text: 'Brazil: storm toll rises to 5, about 250 hurt' },
  { region: 'Americas', text: 'Colombia asks X to suspend ex-president Petro\'s account' },
  { region: 'Americas', text: 'Chile: head-on crash in Chiloé kills 6 of one family' },
  { region: 'Americas', text: 'US: SpaceX launches NROL-136 spy satellites' },
  { region: 'Oceania', text: 'Australia: Marles says US budget office "wrong" on AUKUS' },
];

export const dateCheck = 'Left out on purpose, as they happened before Sunday: the Iranian strike on Bahrain (Sat), the Banten candy-factory fire (Sat), ' +
  'the Nigeria funeral-boat capsize (Fri), Verstappen\'s Las Vegas win (Sat night, local), Wembanyama\'s 50 points (Sat, US), ' +
  'the El Chapo Isidro capture (Fri–Sat), the Kryvyi Rih strike (Sat), Bolsonaro moved to intensive care (Sat), ' +
  'the end of the Geneva killer-robot talks (Sat), protesters storming Meta\'s India offices (Fri).';

export const judgeNote = 'Note for the judge: this page was compiled after 22 November had ended and checked story by story. ' +
  'Events from Friday or Saturday are named in the date check, not shown as Sunday news. It shows how Sunday finished: ' +
  'COP31 ended with no deal and Alcaraz won in Turin.';

export const sources = 'Sources: AP, AFP, Reuters, CNN, Al Jazeera, Kyiv Post, ATP, JoongAng Daily, Korea Times, HK govt, WHO, ABC (AU), Xinhua · drawings made in code';
