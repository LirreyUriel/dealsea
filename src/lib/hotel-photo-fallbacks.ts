import { normalizeHotelKey } from "./hotel-pages";
import type { HotelChainId } from "./types";

interface HotelPhotoFallback {
  names: string[];
  imageUrl: string;
}

function isrotelPhoto(mediaId: string, fileName: string): string {
  return `https://media.isrotel.co.il/umb/${mediaId}/${encodeURIComponent(fileName)}`;
}

const FALLBACKS: Record<HotelChainId, HotelPhotoFallback[]> = {
  dan: [
    { names: ["המלך דוד ירושלים"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/KDDealsBG2.jpg" },
    { names: ["דן ירושלים"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/DJDealsBG2.jpg" },
    { names: ["דן פנורמה ירושלים"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/PJDealsBG2.jpg" },
    { names: ["דן בוטיק ירושלים"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/BJDealsBG2.jpg" },
    { names: ["דן תל אביב"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/DTDealsBG2.jpg" },
    { names: ["דן פנורמה תל אביב"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/PTDealsBG2_1.jpg" },
    { names: ["לינק תל אביב", "לינק"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/LinkDealsBG5.jpg" },
    { names: ["דן אילת"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2023-01/DE%201736x1032%20copy.jpg" },
    { names: ["דן פנורמה אילת"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/PEDealsBG2.jpg" },
    { names: ["נפטון אילת", "נפטון"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2019-05/NeptuneDeals.jpg" },
    { names: ["דן כרמל חיפה", "דן כרמל"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/DCDealsBG2.jpg" },
    { names: ["דן פנורמה חיפה"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2018-09/PHDealsBG2.jpg" },
    { names: ["דן אכדיה", "דן אכדיה ריזורט"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2022-12/ACDealsBG2.jpg" },
    { names: ["דן קיסריה", "דן קיסריה ריזורט"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2019-05/CADealsBG4.jpg" },
    { names: ["רות צפת", "רות"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2020-01/bg2.jpg" },
    { names: ["המעיין נצרת", "המעיין"], imageUrl: "https://www.danhotels.co.il/sites/default/files/2019-03/NazarethDealsBG2.jpg" },
  ],
  isrotel: [
    { names: ["אוריינט ירושלים", "אוריינט"], imageUrl: isrotelPhoto("22239", "resizedji_0107.jpg") },
    { names: ["כרמים"], imageUrl: isrotelPhoto("22511", "באנר-ראשי.jpg") },
    { names: ["רויאל ביץ תל אביב", "רויאל ביץ' תל אביב"], imageUrl: isrotelPhoto("31455", "אדר-רויאל-ביץ-תל-אביב.jpg") },
    { names: ["סי טאואר"], imageUrl: isrotelPhoto("30868", "135505_picturs_1600x4003.jpg") },
    { names: ["פורט טאואר"], imageUrl: isrotelPhoto("28238", "פורט-קאבר.jpg") },
    { names: ["אלברטו"], imageUrl: isrotelPhoto("28694", "alberto23.jpg") },
    { names: ["דיזנגוף 99", "דיזנגוף"], imageUrl: isrotelPhoto("37058", "3485_assaf-pinchuk-photography-3200x800.jpg") },
    { names: ["גימנסיה"], imageUrl: isrotelPhoto("35327", "desktop-1600x400.jpg") },
    { names: ["פאבליקה"], imageUrl: isrotelPhoto("31189", "136894_pic_02_1600-552.jpg") },
    { names: ["רויאל ביץ אילת", "רויאל ביץ' אילת"], imageUrl: isrotelPhoto("35962", "rb_banner.jpg") },
    { names: ["המלך שלמה"], imageUrl: isrotelPhoto("34337", "ksbanner4.jpg") },
    { names: ["רויאל גארדן"], imageUrl: isrotelPhoto("25658", "rg_banner_b.jpg") },
    { names: ["אגמים"], imageUrl: isrotelPhoto("32769", "rb5_0976.jpg") },
    { names: ["ים סוף"], imageUrl: isrotelPhoto("25003", "ים-סוף-עדני-2020.jpg") },
    { names: ["ספורט קלאב"], imageUrl: isrotelPhoto("22062", "באנר-ראשי-אופציה-ב.jpg") },
    { names: ["לגונה"], imageUrl: isrotelPhoto("29151", "לגונה-באנר-ראשי.jpg") },
    { names: ["ריביירה"], imageUrl: isrotelPhoto("31644", "rchotel.jpg") },
    { names: ["איילה"], imageUrl: isrotelPhoto("34452", "ayalabanner.jpg") },
    { names: ["נבו"], imageUrl: isrotelPhoto("25063", "באנר-ים-המלח-חדש-2020.jpg") },
    { names: ["נגה"], imageUrl: isrotelPhoto("30869", "noga_banner.jpg") },
    { names: ["קיימא"], imageUrl: isrotelPhoto("35062", "kabanner.jpg") },
    { names: ["בראשית"], imageUrl: isrotelPhoto("21611", "beresheet_18.jpg") },
    { names: ["קדמה"], imageUrl: isrotelPhoto("32743", "newbannerkd.jpg") },
    { names: ["יערות הכרמל"], imageUrl: isrotelPhoto("31468", "אדר.jpg") },
    { names: ["מצפה הימים"], imageUrl: isrotelPhoto("25944", "mh_for_en_.jpg") },
    { names: ["גומה"], imageUrl: isrotelPhoto("28652", "127588_pics1600x400_b2.jpg") },
  ],
  atlas: [],
  "herbert-samuel": [
    { names: ["הרברט סמואל ירושלים"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/Jerusalem-Header-007-ql1v0uq1w7kbu6tm6n6yvn1h3ajdxz6tvynzpaacgw.jpg" },
    { names: ["הרברט סמואל הוד ים המלח"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/Hod-Header-001-qkv3th9esy48o0hpf332q10h7gnud6ymsvvfxryu1s.jpg" },
    { names: ["הרברט סמואל מילוס ים המלח"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/Milos-Header-001-qkh1obvbe2qjp7q84w5xy2l2w6e1qu9dmkff28nbts.jpg" },
    { names: ["הרברט סמואל אופרה תל אביב"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/Opera-Pool-002-qjbeszmqmqgvp8ohs66sw0u7c33wtif5wmq94gp674.jpg" },
    { names: ["דה הרברט תל אביב"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/The-Herbert-Home-header-001-qianliyjw13zwtujfhb9inzs0g8qzoxnaz9iha9wo0.jpg" },
    { names: ["הרברט סמואל הריף אילת"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/2024/03/Reef-Header-001.jpg" },
    { names: ["הרברט סמואל רויאל שנגרילה אילת"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/2024/03/Shangrilla-Villa-Royal-018.jpg" },
    { names: ["דה הרברט אילת"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/elementor/thumbs/COVER-1-rjmkznyodcd6ifn5qeyyvms25g30aturarlbhnmx0g.jpg" },
    { names: ["הרברט סמואל אוקיינוס סוויטס הרצליה"], imageUrl: "https://herbertsamuel.com/wp-content/uploads/2024/01/Okeanos-Home-Header-001.jpg" },
  ],
  fattal: [
    { names: ["לאונרדו פלאזה סיטי טאוור"], imageUrl: "https://assets.fattal.co.il/Leonardo_City_Towel_Bar_02_900x600_5743133508.jpg" },
    { names: ["לאונרדו ירושלים"], imageUrl: "https://assets.fattal.co.il/Leonardo_Jerusalem_pool_300_dpi_01c6941064.jpg" },
    { names: ["לאונרדו פלאזה אילת"], imageUrl: "https://assets.fattal.co.il/SP_LPE_01_FEB_20_900_X600_2_1ee9199df1.jpg" },
    { names: ["הרודס פאלאס אילת", "הרודס"], imageUrl: "https://assets.fattal.co.il/herods_palace_eilat_4_1d1a4d48b6.jpg" },
    { names: ["לאונרדו קלאב טבריה"], imageUrl: "https://assets.fattal.co.il/3_bc70f94c9e.jpg" },
    { names: ["נוצ'ה", "Nucha"], imageUrl: "https://assets.fattal.co.il/notzahotel44917_1_67303aa81a.jpg" },
    { names: ["יו בוטיק כנרת"], imageUrl: "https://assets.fattal.co.il/27_dfc88432b6.jpg" },
    { names: ["NYX ניקס תל אביב", "ניקס תל אביב"], imageUrl: "https://assets.fattal.co.il/NYX_lobby_300_dpi_7f5c18e6ee.jpg" },
    { names: ["לאונרדו בוטיק תל אביב"], imageUrl: "https://assets.fattal.co.il/Leonardo_Boutique_TA_Presidential_suite_07_95ea520d6d.jpg" },
    { names: ["לאונרדו בוטיק רחובות"], imageUrl: "https://assets.fattal.co.il/L_LBR_02_900x600_26acec3149.jpg" },
    { names: ["סאם ובלונדי"], imageUrl: "https://assets.fattal.co.il/sam_8_166af1b7a5.jpg" },
    { names: ["בזאר", "Bazaar"], imageUrl: "https://assets.fattal.co.il/bazar_400_4ecc3c8f39.jpg" },
    { names: ["לאונרדו טבריה"], imageUrl: "https://assets.fattal.co.il/leonardo_tiberias_view_97c9221326.jpg" },
    { names: ["לאונרדו גורדון ביץ'"], imageUrl: "https://assets.fattal.co.il/Leonardo_Gordon_beach_Lobby_09_900x600_33e0142864.jpg" },
    { names: ["לאונרדו פלאזה אשדוד"], imageUrl: "https://assets.fattal.co.il/leonardo_plaza_ashdod_pool_1_c400ed8dd6.jpg" },
    { names: ["רוטשילד 22 תל אביב"], imageUrl: "https://assets.fattal.co.il/Leonardo_Gordon_beach_breakfast_02_900x600_9b3643c273.jpg" },
  ],
  brown: [],
  "africa-israel": [],
};

export const HOTEL_PHOTO_PAGES: { chainId: HotelChainId; name: string; pageUrl: string }[] = [
  { chainId: "dan", name: "המלך דוד ירושלים", pageUrl: "https://www.danhotels.co.il/JerusalemHotels/KingDavidJerusalemHotel" },
  { chainId: "dan", name: "דן ירושלים", pageUrl: "https://www.danhotels.co.il/JerusalemHotels/DanJerusalemHotel" },
  { chainId: "dan", name: "דן פנורמה ירושלים", pageUrl: "https://www.danhotels.co.il/JerusalemHotels/DanPanoramaJerusalemHotel" },
  { chainId: "dan", name: "דן בוטיק ירושלים", pageUrl: "https://www.danhotels.co.il/JerusalemHotels/DanBoutiqueJerusalemHotel" },
  { chainId: "dan", name: "דן תל אביב", pageUrl: "https://www.danhotels.co.il/TelAvivHotels/DanTelAvivHotel" },
  { chainId: "dan", name: "דן פנורמה תל אביב", pageUrl: "https://www.danhotels.co.il/TelAvivHotels/DanPanoramaTelAvivHotel" },
  { chainId: "dan", name: "לינק תל אביב", pageUrl: "https://www.danhotels.co.il/TelAvivHotels/LinkHotelHubHotel" },
  { chainId: "dan", name: "דן אילת", pageUrl: "https://www.danhotels.co.il/EilatHotels/DanEilatHotel" },
  { chainId: "dan", name: "דן פנורמה אילת", pageUrl: "https://www.danhotels.co.il/EilatHotels/DanPanoramaEilatHotel" },
  { chainId: "dan", name: "נפטון אילת", pageUrl: "https://www.danhotels.co.il/EilatHotels/NeptuneEilatHotel" },
  { chainId: "dan", name: "דן כרמל חיפה", pageUrl: "https://www.danhotels.co.il/HaifaHotels/DanCarmelHaifaHotel" },
  { chainId: "dan", name: "דן פנורמה חיפה", pageUrl: "https://www.danhotels.co.il/HaifaHotels/DanPanoramaHaifaHotel" },
  { chainId: "dan", name: "דן אכדיה", pageUrl: "https://www.danhotels.co.il/TelAvivHotels/DanAccadiaHerzliyaHotel" },
  { chainId: "dan", name: "דן קיסריה", pageUrl: "https://www.danhotels.co.il/CaesareaHotels/DanCaesareaHotel" },
  { chainId: "dan", name: "רות צפת", pageUrl: "https://www.danhotels.co.il/NorthHotels/RuthSafedHotel" },
  { chainId: "dan", name: "המעיין נצרת", pageUrl: "https://www.danhotels.co.il/NorthHotels/MarysWellNazarethHotel" },
  { chainId: "isrotel", name: "אוריינט ירושלים", pageUrl: "https://www.isrotel.com/isrotel-hotels/jerusalem/orient/" },
  { chainId: "isrotel", name: "כרמים", pageUrl: "https://www.isrotel.com/isrotel-hotels/jerusalem/cramim/" },
  { chainId: "isrotel", name: "רויאל ביץ תל אביב", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/royal-beach-tel-aviv/" },
  { chainId: "isrotel", name: "סי טאואר", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/isrotel-tower/" },
  { chainId: "isrotel", name: "פורט טאואר", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/port-tower/" },
  { chainId: "isrotel", name: "אלברטו", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/alberto/" },
  { chainId: "isrotel", name: "דיזנגוף 99", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/dizengoff/" },
  { chainId: "isrotel", name: "גימנסיה", pageUrl: "https://www.isrotel.com/isrotel-hotels/tel-aviv/gymnasia/" },
  { chainId: "isrotel", name: "פאבליקה", pageUrl: "https://www.isrotel.com/isrotel-hotels/herzliya/publica-isrotel/" },
  { chainId: "isrotel", name: "רויאל ביץ אילת", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/royal-beach/" },
  { chainId: "isrotel", name: "המלך שלמה", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-king-solomon/" },
  { chainId: "isrotel", name: "רויאל גארדן", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-royal-garden/" },
  { chainId: "isrotel", name: "אגמים", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-agamim/" },
  { chainId: "isrotel", name: "ים סוף", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-yam-suf/" },
  { chainId: "isrotel", name: "ספורט קלאב", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-sport-club/" },
  { chainId: "isrotel", name: "לגונה", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-lagoona/" },
  { chainId: "isrotel", name: "ריביירה", pageUrl: "https://www.isrotel.com/isrotel-hotels/eilat/isrotel-riviera-club/" },
  { chainId: "isrotel", name: "איילה", pageUrl: "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/ayala/" },
  { chainId: "isrotel", name: "נבו", pageUrl: "https://www.isrotel.com/isrotel-hotels/dead-sea/isrotel-dead-sea/" },
  { chainId: "isrotel", name: "נגה", pageUrl: "https://www.isrotel.com/isrotel-hotels/dead-sea/isrotel-ganim/" },
  { chainId: "isrotel", name: "קיימא", pageUrl: "https://www.isrotel.com/isrotel-hotels/dead-sea/kayma/" },
  { chainId: "isrotel", name: "בראשית", pageUrl: "https://www.isrotel.com/isrotel-hotels/negev-desert/beresheet/" },
  { chainId: "isrotel", name: "קדמה", pageUrl: "https://www.isrotel.com/isrotel-hotels/negev-desert/isrotel-kedma/" },
  { chainId: "isrotel", name: "יערות הכרמל", pageUrl: "https://www.isrotel.com/isrotel-hotels/north-hotels/haifa/carmel-forest/" },
  { chainId: "isrotel", name: "מצפה הימים", pageUrl: "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/mizpe-hayamim/" },
  { chainId: "isrotel", name: "גומה", pageUrl: "https://www.isrotel.com/isrotel-hotels/north-hotels/galilee/gomeh/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל ירושלים", pageUrl: "https://herbertsamuel.com/herbert-samuel-jerusalem-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל הוד ים המלח", pageUrl: "https://herbertsamuel.com/hod-dead-sea-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל מילוס ים המלח", pageUrl: "https://herbertsamuel.com/milos-dead-sea-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל אופרה תל אביב", pageUrl: "https://herbertsamuel.com/opera-tel-aviv-hotel/" },
  { chainId: "herbert-samuel", name: "דה הרברט תל אביב", pageUrl: "https://herbertsamuel.com/the-herbert-tel-aviv-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל הריף אילת", pageUrl: "https://herbertsamuel.com/the-reef-eilat-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל רויאל שנגרילה אילת", pageUrl: "https://herbertsamuel.com/royal-shangri-la-eilat-hotel/" },
  { chainId: "herbert-samuel", name: "דה הרברט אילת", pageUrl: "https://herbertsamuel.com/the-herbert-eilat-hotel/" },
  { chainId: "herbert-samuel", name: "הרברט סמואל אוקיינוס סוויטס הרצליה", pageUrl: "https://herbertsamuel.com/okeanos-suites-herzliya-hotel/" },
  { chainId: "atlas", name: "נווה אילת", pageUrl: "https://www.atlas.co.il/neve-eilat/" },
  { chainId: "atlas", name: "ארטיסט", pageUrl: "https://www.atlas.co.il/the-artist-hotel/" },
  { chainId: "atlas", name: "סינמה", pageUrl: "https://www.atlas.co.il/cinema-hotel/" },
  { chainId: "atlas", name: "מלון ים", pageUrl: "https://www.atlas.co.il/yam-hotel/" },
  { chainId: "atlas", name: "מלודי", pageUrl: "https://www.atlas.co.il/melody-hotel/" },
  { chainId: "atlas", name: "פבריק", pageUrl: "https://www.atlas.co.il/fabrik-hotel/" },
  { chainId: "atlas", name: "בקסטייג'", pageUrl: "https://www.atlas.co.il/backstage-hotel/" },
  { chainId: "atlas", name: "מרקט האוס", pageUrl: "https://www.atlas.co.il/market-house-hotel/" },
  { chainId: "atlas", name: "מלון 65", pageUrl: "https://www.atlas.co.il/65-hotel/" },
  { chainId: "atlas", name: "שלום & רילקס", pageUrl: "https://www.atlas.co.il/shalom-hotel/" },
  { chainId: "atlas", name: "בצלאל", pageUrl: "https://www.atlas.co.il/bezalel-hotel/" },
  { chainId: "atlas", name: "ארתור", pageUrl: "https://www.atlas.co.il/arthur-hotel/" },
  { chainId: "atlas", name: "מלון טל", pageUrl: "https://www.atlas.co.il/tal-hotel/" },
  { chainId: "atlas", name: "שדות", pageUrl: "https://www.atlas.co.il/sadot-hotel/" },
];

export function lookupHotelPhoto(chainId: HotelChainId, hotelName: string): string | null {
  const needle = normalizeHotelKey(hotelName);
  if (!needle) return null;

  const exact = FALLBACKS[chainId]?.find((entry) =>
    entry.names.some((name) => normalizeHotelKey(name) === needle),
  );
  if (exact) return exact.imageUrl;

  let best: string | null = null;
  let bestScore = 0;
  for (const entry of FALLBACKS[chainId] ?? []) {
    for (const name of entry.names) {
      const hay = normalizeHotelKey(name);
      if (!hay) continue;
      if (needle.includes(hay) || hay.includes(needle)) {
        const score = Math.min(hay.length, needle.length);
        if (score > bestScore) {
          best = entry.imageUrl;
          bestScore = score;
        }
      }
    }
  }
  return best;
}

