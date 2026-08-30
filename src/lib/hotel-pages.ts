import type { HotelChainId } from "./types";

export function normalizeHotelKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/['׳`״"]/g, "")
    .replace(/^(ה)?מלונות?\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hotelImageKey(chainId: HotelChainId, hotelName: string): string {
  return `${chainId}:${normalizeHotelKey(hotelName)}`;
}

const DAN_PAGES: [string, string][] = [
  ["המלך דוד ירושלים", "https://www.danhotels.co.il/JerusalemHotels/KingDavidJerusalemHotel"],
  ["דן ירושלים", "https://www.danhotels.co.il/JerusalemHotels/DanJerusalemHotel"],
  ["דן פנורמה ירושלים", "https://www.danhotels.co.il/JerusalemHotels/DanPanoramaJerusalemHotel"],
  ["דן בוטיק ירושלים", "https://www.danhotels.co.il/JerusalemHotels/DanBoutiqueJerusalemHotel"],
  ["דן תל אביב", "https://www.danhotels.co.il/TelAvivHotels/DanTelAvivHotel"],
  ["דן פנורמה תל אביב", "https://www.danhotels.co.il/TelAvivHotels/DanPanoramaTelAvivHotel"],
  ["לינק תל אביב", "https://www.danhotels.co.il/TelAvivHotels/LinkHotelHubHotel"],
  ["דן אילת", "https://www.danhotels.co.il/EilatHotels/DanEilatHotel"],
  ["דן פנורמה אילת", "https://www.danhotels.co.il/EilatHotels/DanPanoramaEilatHotel"],
  ["נפטון אילת", "https://www.danhotels.co.il/EilatHotels/NeptuneEilatHotel"],
  ["דן כרמל חיפה", "https://www.danhotels.co.il/HaifaHotels/DanCarmelHaifaHotel"],
  ["דן פנורמה חיפה", "https://www.danhotels.co.il/HaifaHotels/DanPanoramaHaifaHotel"],
  ["דן אכדיה", "https://www.danhotels.co.il/TelAvivHotels/DanAccadiaHerzliyaHotel"],
  ["דן קיסריה", "https://www.danhotels.co.il/CaesareaHotels/DanCaesareaHotel"],
  ["רות צפת", "https://www.danhotels.co.il/NorthHotels/RuthSafedHotel"],
  ["המעיין נצרת", "https://www.danhotels.co.il/NorthHotels/MarysWellNazarethHotel"],
];

const ISROTEL_PAGES: [string, string][] = [
  ["אוריינט ירושלים", "https://www.isrotel.com/isrotel-hotels/jerusalem/orient/"],
  ["כרמים", "https://www.isrotel.com/isrotel-hotels/jerusalem/cramim/"],
  ["רויאל ביץ תל אביב", "https://www.isrotel.com/isrotel-hotels/tel-aviv/royal-beach-tel-aviv/"],
  ["סי טאואר", "https://www.isrotel.com/isrotel-hotels/tel-aviv/isrotel-tower/"],
  ["פורט טאואר", "https://www.isrotel.com/isrotel-hotels/tel-aviv/port-tower/"],
  ["אלברטו", "https://www.isrotel.com/isrotel-hotels/tel-aviv/alberto/"],
  ["דיזנגוף 99", "https://www.isrotel.com/isrotel-hotels/tel-aviv/dizengoff/"],
  ["גימנסיה", "https://www.isrotel.com/isrotel-hotels/tel-aviv/gymnasia/"],
  ["פאבליקה", "https://www.isrotel.com/isrotel-hotels/herzliya/publica-isrotel/"],
  ["רויאל ביץ אילת", "https://www.isrotel.com/isrotel-hotels/eilat/royal-beach/"],
  ["המלך שלמה", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-king-solomon/"],
  ["רויאל גארדן", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-royal-garden/"],
  ["אגמים", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-agamim/"],
  ["ים סוף", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-yam-suf/"],
  ["ספורט קלאב", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-sport-club/"],
  ["לגונה", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-lagoona/"],
  ["ריביירה", "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-riviera-club/"],
  ["איילה", "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/ayala/"],
  ["נבו", "https://www.isrotel.com/isrotel-hotels/dead-sea/isrotel-dead-sea/"],
  ["נגה", "https://www.isrotel.com/isrotel-hotels/dead-sea/isrotel-ganim/"],
  ["קיימא", "https://www.isrotel.com/isrotel-hotels/dead-sea/kayma/"],
  ["בראשית", "https://www.isrotel.com/isrotel-hotels/negev-desert/beresheet/"],
  ["קדמה", "https://www.isrotel.com/isrotel-hotels/negev-desert/isrotel-kedma/"],
  ["יערות הכרמל", "https://www.isrotel.com/isrotel-hotels/north-hotels/haifa/carmel-forest/"],
  ["מצפה הימים", "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/mizpe-hayamim/"],
  ["גומה", "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/gomeh/"],
];

function matchOfficialPage(hotelName: string, pages: [string, string][]): string | null {
  const needle = normalizeHotelKey(hotelName);
  if (!needle) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const [name, url] of pages) {
    const hay = normalizeHotelKey(name);
    if (hay === needle) return url;
    if (needle.includes(hay) || hay.includes(needle)) {
      const score = Math.min(hay.length, needle.length);
      if (score > bestScore) {
        best = url;
        bestScore = score;
      }
    }
  }
  return best;
}

export function officialHotelPageUrls(chainId: HotelChainId, hotelName: string, bookingUrl: string): string[] {
  const urls: string[] = [];
  if (chainId === "dan") {
    const page = matchOfficialPage(hotelName, DAN_PAGES);
    if (page) urls.push(page);
  }
  if (chainId === "isrotel") {
    const page = matchOfficialPage(hotelName, ISROTEL_PAGES);
    if (page) urls.push(page);
  }
  if (/^https?:\/\//i.test(bookingUrl) && !/google|doubleclick/i.test(bookingUrl)) {
    urls.push(bookingUrl);
  }
  return [...new Set(urls)];
}
