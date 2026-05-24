//! Multi-language relative time parsing with trie-based keyword matching

// Time unit multipliers (in seconds)
export const SECOND = 1
export const MINUTE = SECOND * 60
export const HOUR = MINUTE * 60
export const DAY = HOUR * 24
export const WEEK = DAY * 7
export const MONTH = DAY * 30
export const YEAR = DAY * 365

/**
 * Trie node for word sequence matching
 */
class TrieNode {
  constructor() {
    this.value = null
    this.children = new Map()
  }

  /**
   * Insert a word sequence into the trie
   * @param {string[]} words - Array of words to insert
   * @param {number} value - Time multiplier value
   */
  insert(words, value) {
    if (words.length === 0) return

    if (words.length === 1) {
      const node = this.children.get(words[0]) || new TrieNode()
      node.value = value
      this.children.set(words[0], node)
    } else {
      const node = this.children.get(words[0]) || new TrieNode()
      this.children.set(words[0], node)
      node.insert(words.slice(1), value)
    }
  }

  /**
   * Look up a word sequence, returning the value and number of words consumed
   * @param {string[]} words - Array of words to look up
   * @returns {[number, number] | null} - [value, wordsConsumed] or null if no match
   */
  lookup(words) {
    if (words.length === 0) {
      return this.value !== null ? [this.value, 0] : null
    }

    const word = words[0].toLowerCase()
    const child = this.children.get(word)

    if (child) {
      // Try to match more words first (longest match)
      const result = child.lookup(words.slice(1))
      if (result) {
        return [result[0], result[1] + 1]
      }
      // Otherwise return this node's value if it has one
      if (child.value !== null) {
        return [child.value, 1]
      }
    }

    // No match for this word, return our value if we have one
    return this.value !== null ? [this.value, 0] : null
  }
}

// Global trie instance
let TRIE = null

/**
 * Helper to insert a single word
 */
function word(keyword, value) {
  TRIE.insert([keyword], value)
}

/**
 * Helper to insert a word sequence
 * This is used to dismabiguate languages
 * Example:
 * 3 seconds ago in french is 'il y a 3 secondes'
 * However, Azerbajiani for 'A year ago' is 'il öncə'.
 * We want to treat 'il öncə' as one year, so we need to treat the whole combination as the year
 */
function words(value, ...keywords) {
  TRIE.insert(keywords, value)
}

/**
 * Build the trie with all language keywords
 */
function getTrie() {
  if (TRIE) return TRIE

  TRIE = new TrieNode()

  // English
  word('second', SECOND)
  word('seconds', SECOND)
  word('minute', MINUTE)
  word('minutes', MINUTE)
  word('hour', HOUR)
  word('hours', HOUR)
  word('day', DAY)
  word('days', DAY)
  word('week', WEEK)
  word('weeks', WEEK)
  word('month', MONTH)
  word('months', MONTH)
  word('year', YEAR)
  word('years', YEAR)

  // German
  word('sekunden', SECOND)
  word('sekunde', SECOND)
  word('minuten', MINUTE)
  word('minute', MINUTE)
  word('stunden', HOUR)
  word('stunde', HOUR)
  word('tagen', DAY)
  word('tag', DAY)
  word('wochen', WEEK)
  word('woche', WEEK)
  word('monaten', MONTH)
  word('monat', MONTH)
  word('jahren', YEAR)
  word('jahr', YEAR)

  // French
  word('secondes', SECOND)
  word('seconde', SECOND)
  word('heures', HOUR)
  word('heure', HOUR)
  word('jours', DAY)
  word('jour', DAY)
  word('semaines', WEEK)
  word('semaine', WEEK)
  word('mois', MONTH)
  word('ans', YEAR)
  word('an', YEAR)

  // Spanish
  word('segundos', SECOND)
  word('segundo', SECOND)
  word('minutos', MINUTE)
  word('minuto', MINUTE)
  word('horas', HOUR)
  word('hora', HOUR)
  word('días', DAY)
  word('día', DAY)
  word('semanas', WEEK)
  word('semana', WEEK)
  word('meses', MONTH)
  word('mes', MONTH)
  word('años', YEAR)
  word('año', YEAR)

  // Portuguese
  word('segundo', SECOND)
  word('segundos', SECOND)
  word('minuto', MINUTE)
  word('minutos', MINUTE)
  word('hora', HOUR)
  word('horas', HOUR)
  word('dia', DAY)
  word('dias', DAY)
  word('semana', WEEK)
  word('semanas', WEEK)
  word('mês', MONTH)
  word('meses', MONTH)
  word('ano', YEAR)
  word('anos', YEAR)

  // Russian
  word('секунду', SECOND)
  word('минут', MINUTE)
  word('минуты', MINUTE)
  word('минуту', MINUTE)
  word('часов', HOUR)
  word('часа', HOUR)
  word('дней', DAY)
  word('дня', DAY)
  word('день', DAY)
  word('недели', WEEK)
  word('недель', WEEK)
  word('неделю', WEEK)
  word('месяцев', MONTH)
  word('месяца', MONTH)
  word('лет', YEAR)
  word('года', YEAR)

  // Italian
  word('secondi', SECOND)
  word('ore', HOUR)
  word('ora', HOUR)
  word('giorni', DAY)
  word('giorno', DAY)
  word('settimane', WEEK)
  word('settimana', WEEK)
  word('mesi', MONTH)
  word('mese', MONTH)
  word('anni', YEAR)
  word('anno', YEAR)

  // Dutch
  word('seconden', SECOND)
  word('minuut', MINUTE)
  word('dagen', DAY)
  word('weken', WEEK)
  word('maanden', MONTH)

  // Polish
  word('sekund', SECOND)
  word('sekundy', SECOND)
  word('minut', MINUTE)
  word('minuty', MINUTE)
  word('godzin', HOUR)
  word('godziny', HOUR)
  word('dni', DAY)
  word('dzień', DAY)
  word('tygodnie', WEEK)
  word('tygodni', WEEK)
  word('miesiące', MONTH)
  word('miesięcy', MONTH)
  word('miesiąc', MONTH)
  word('lata', YEAR)
  word('lat', YEAR)
  word('rok', YEAR)

  // Turkish
  word('saniye', SECOND)
  word('dakika', MINUTE)
  word('saat', HOUR)
  word('gün', DAY)
  word('hafta', WEEK)
  word('ay', MONTH)
  word('yıl', YEAR)

  // Swedish
  word('sekunder', SECOND)
  word('minuter', MINUTE)
  word('timmar', HOUR)
  word('timme', HOUR)
  word('dagar', DAY)
  word('veckor', WEEK)
  word('vecka', WEEK)
  word('månad', MONTH)
  word('månader', MONTH)
  word('år', YEAR)

  // Danish
  word('sekunder', SECOND)
  word('sekund', SECOND)
  word('minutter', MINUTE)
  word('timer', HOUR)
  word('time', HOUR)
  word('dage', DAY)
  word('døgn', DAY)
  word('uger', WEEK)
  word('uge', WEEK)
  word('måneder', MONTH)
  word('måned', MONTH)
  word('år', YEAR)

  // Norwegian
  word('sekunder', SECOND)
  word('minutt', MINUTE)
  word('timer', HOUR)
  word('dager', DAY)
  word('uker', WEEK)
  word('uke', WEEK)
  word('måneder', MONTH)
  word('måned', MONTH)
  word('år', YEAR)

  // Finnish
  word('sekuntia', SECOND)
  word('sekunti', SECOND)
  word('minuuttia', MINUTE)
  word('minuutti', MINUTE)
  word('tuntia', HOUR)
  word('tunti', HOUR)
  word('päivää', DAY)
  word('päivä', DAY)
  word('viikkoa', WEEK)
  word('viikko', WEEK)
  word('kuukautta', MONTH)
  word('kuukausi', MONTH)
  word('vuotta', YEAR)
  word('vuosi', YEAR)

  // Greek
  word('δευτερόλεπτα', SECOND)
  word('δευτερόλεπτο', SECOND)
  word('λεπτά', MINUTE)
  word('λεπτό', MINUTE)
  word('ώρες', HOUR)
  word('ώρα', HOUR)
  word('ημέρες', DAY)
  word('ημέρα', DAY)
  word('εβδομάδες', WEEK)
  word('εβδομάδα', WEEK)
  word('μήνες', MONTH)
  word('μήνα', MONTH)
  word('έτη', YEAR)
  word('έτος', YEAR)
  word('χρόνια', YEAR)
  word('χρόνο', YEAR)

  // Czech
  word('sekundou', SECOND)
  word('minutou', MINUTE)
  word('hodinou', HOUR)
  word('dny', DAY)
  word('dnem', DAY)
  word('týdny', WEEK)
  word('týdnem', WEEK)
  word('měsíci', MONTH)
  word('měsícem', MONTH)
  word('rokem', YEAR)
  word('lety', YEAR)

  // Hungarian
  word('másodperce', SECOND)
  word('másodperccel', SECOND)
  word('perce', MINUTE)
  word('perccel', MINUTE)
  word('órája', HOUR)
  word('órával', HOUR)
  word('nappal', DAY)
  word('napja', DAY)
  word('héttel', WEEK)
  word('hete', WEEK)
  word('hónappal', MONTH)
  word('hónapja', MONTH)
  word('évvel', YEAR)
  word('éve', YEAR)

  // Romanian
  word('secundă', SECOND)
  word('secunde', SECOND)
  word('minute', MINUTE)
  word('minut', MINUTE)
  word('oră', HOUR)
  word('ore', HOUR)
  word('zile', DAY)
  word('zi', DAY)
  word('săptămâni', WEEK)
  word('săptămână', WEEK)
  word('luni', MONTH)
  word('lună', MONTH)
  word('ani', YEAR)

  // Ukrainian
  word('секунди', SECOND)
  word('хвилин', MINUTE)
  word('хвилини', MINUTE)
  word('хвилину', MINUTE)
  word('годин', HOUR)
  word('години', HOUR)
  word('годину', HOUR)
  word('днів', DAY)
  word('тижні', WEEK)
  word('тижнів', WEEK)
  word('тиждень', WEEK)
  word('місяців', MONTH)
  word('місяці', MONTH)
  word('місяць', MONTH)
  word('років', YEAR)
  word('роки', YEAR)
  word('рік', YEAR)

  // Vietnamese
  word('giây', SECOND)
  word('phút', MINUTE)
  word('giờ', HOUR)
  word('ngày', DAY)
  word('tuần', WEEK)
  word('tháng', MONTH)
  word('năm', YEAR)

  // Thai
  word('วินาที', SECOND)
  word('นาที', MINUTE)
  word('ชั่วโมง', HOUR)
  word('วัน', DAY)
  word('วันที่ผ่านมา', DAY)
  word('สัปดาห์', WEEK)
  word('สัปดาห์ที่ผ่านมา', WEEK)
  word('เดือน', MONTH)
  word('เดือนที่ผ่านมา', MONTH)
  word('ปี', YEAR)
  word('ปีที่แล้ว', YEAR)

  // Indonesian
  word('detik', SECOND)
  word('menit', MINUTE)
  word('jam', HOUR)
  word('hari', DAY)
  word('minggu', WEEK)
  word('bulan', MONTH)
  word('tahun', YEAR)

  // Malay
  // "saat" means seconds in Malay but hours in Azerbaijani/Turkish
  // Use "lalu" to disambiguate
  words(SECOND, 'saat', 'lalu')
  word('minit', MINUTE)
  word('jam', HOUR)
  word('hari', DAY)
  word('minggu', WEEK)
  word('bulan', MONTH)
  word('tahun', YEAR)

  // Azerbaijani
  word('saniyə', SECOND)
  word('dəqiqə', MINUTE)
  word('saat', HOUR)
  word('gün', DAY)
  word('həftə', WEEK)
  word('ay', MONTH)
  // "il" needs next word "öncə" to disambiguate from French "il y a"
  words(YEAR, 'il', 'öncə')

  // Hebrew
  word('שניות', SECOND)
  word('שנייה', SECOND)
  word('דקות', MINUTE)
  word('דקה', MINUTE)
  word('שעות', HOUR)
  word('שעה', HOUR)
  word('ימים', DAY)
  word('יום', DAY)
  word('שבועות', WEEK)
  word('שבוע', WEEK)
  word('חודשים', MONTH)
  word('חודשיים', MONTH)
  word('חודש', MONTH)
  word('שנים', YEAR)
  word('שנה', YEAR)

  // Arabic
  word('ثانية', SECOND)
  word('ثوان', SECOND)
  word('دقيقة', MINUTE)
  word('دقائق', MINUTE)
  word('ساعة', HOUR)
  word('ساعات', HOUR)
  word('أيام', DAY)
  word('يوم', DAY)
  word('أسابيع', WEEK)
  word('أسبوع', WEEK)
  word('أشهر', MONTH)
  word('شهر', MONTH)
  word('شهرين', MONTH)
  word('شهرًا', MONTH)
  word('سنتين', YEAR)
  word('سنة', YEAR)
  word('سنوات', YEAR)

  // Hindi
  word('सेकंड', SECOND)
  word('मिनट', MINUTE)
  word('घंटे', HOUR)
  word('घंटा', HOUR)
  word('दिन', DAY)
  word('सप्ताह', WEEK)
  word('हफ़्ते', WEEK)
  word('माह', MONTH)
  word('महीने', MONTH)
  word('महीना', MONTH)
  word('साल', YEAR)
  word('वर्ष', YEAR)

  // Bengali
  word('সেকেন্ড', SECOND)
  word('মিনিট', MINUTE)
  word('ঘন্টা', HOUR)
  word('দিন', DAY)
  word('সপ্তাহ', WEEK)
  word('মাস', MONTH)
  word('বছর', YEAR)

  // Tamil
  word('வினாடிகளுக்கு', SECOND)
  word('வினாடி', SECOND)
  word('நிமிடங்களுக்கு', MINUTE)
  word('நிமிடம்', MINUTE)
  word('மணிநேரத்துக்கு', HOUR)
  word('மணிநேரம்', HOUR)
  word('நாட்களுக்கு', DAY)
  word('நாள்', DAY)
  word('வாரங்களுக்கு', WEEK)
  word('வாரம்', WEEK)
  word('மாதங்களுக்கு', MONTH)
  word('மாதத்துக்கு', MONTH)
  word('மாதம்', MONTH)
  word('ஆண்டுகளுக்கு', YEAR)
  word('ஆண்டிற்கு', YEAR)
  word('ஆண்டு', YEAR)

  // Telugu
  word('సెకన్ల', SECOND)
  word('సెకను', SECOND)
  word('నిమిషాల', MINUTE)
  word('నిమిషం', MINUTE)
  word('గంటల', HOUR)
  word('గంట', HOUR)
  word('రోజుల', DAY)
  word('రోజు', DAY)
  word('వారాల', WEEK)
  word('వారం', WEEK)
  word('నెలల', MONTH)
  word('నెల', MONTH)
  word('సంవత్సరాల', YEAR)
  word('సంవత్సరం', YEAR)

  // Afrikaans
  word('sekonde', SECOND)
  word('uur', HOUR)
  word('dag', DAY)
  word('dae', DAY)
  word('weke', WEEK)
  word('maand', MONTH)
  word('maande', MONTH)
  word('jaar', YEAR)

  // Armenian
  word('վայրկան', SECOND)
  word('րոպե', MINUTE)
  word('ժամ', HOUR)
  word('օր', DAY)
  word('շաբաթ', WEEK)
  word('ամիս', MONTH)
  word('տարի', YEAR)

  // Basque
  word('minutu', MINUTE)
  word('ordu', HOUR)
  word('egun', DAY)
  word('aste', WEEK)
  word('hilabete', MONTH)
  word('urte', YEAR)

  // Belarusian
  word('секунд', SECOND)
  word('секунды', SECOND)
  word('хвілін', MINUTE)
  word('хвіліны', MINUTE)
  word('гадзін', HOUR)
  word('гадзіны', HOUR)
  word('дзён', DAY)
  word('дні', DAY)
  word('тыдні', WEEK)
  word('тыдняў', WEEK)
  word('месяц', MONTH)
  word('месяцы', MONTH)
  word('месяцаў', MONTH)
  word('год', YEAR)
  word('гады', YEAR)
  word('гадоў', YEAR)

  // Bosnian/Croatian/Serbian Latin
  word('sekundi', SECOND)
  word('sekunde', SECOND)
  word('minuta', MINUTE)
  word('sata', HOUR)
  word('sati', HOUR)
  word('dana', DAY)
  word('dan', DAY)
  word('sedmice', WEEK)
  word('sedmica', WEEK)
  word('tjedna', WEEK)
  word('tjedan', WEEK)
  word('mjesec', MONTH)
  word('mjeseca', MONTH)
  word('mjeseci', MONTH)
  word('godinu', YEAR)
  word('godine', YEAR)
  word('godina', YEAR)

  // Bulgarian
  word('секунди', SECOND)
  word('секунда', SECOND)
  word('минути', MINUTE)
  word('минута', MINUTE)
  word('часа', HOUR)
  word('час', HOUR)
  word('дни', DAY)
  word('ден', DAY)
  word('седмици', WEEK)
  word('седмица', WEEK)
  word('месец', MONTH)
  word('месеца', MONTH)
  word('години', YEAR)
  word('година', YEAR)

  // Catalan
  word('segons', SECOND)
  word('segon', SECOND)
  word('minuts', MINUTE)
  word('minut', MINUTE)
  word('hores', HOUR)
  word('hora', HOUR)
  word('dies', DAY)
  word('dia', DAY)
  word('setmanes', WEEK)
  word('setmana', WEEK)
  word('mesos', MONTH)
  word('mes', MONTH)
  word('anys', YEAR)
  word('any', YEAR)

  // Estonian
  word('sekundi', SECOND)
  word('sekundit', SECOND)
  word('minuti', MINUTE)
  word('minutit', MINUTE)
  word('tunni', HOUR)
  word('tundi', HOUR)
  word('päeva', DAY)
  word('nädala', WEEK)
  word('nädalat', WEEK)
  word('kuu', MONTH)
  word('aasta', YEAR)

  // Georgian
  word('წამის', SECOND)
  word('წამი', SECOND)
  word('წუთის', MINUTE)
  word('წუთი', MINUTE)
  word('საათის', HOUR)
  word('საათი', HOUR)
  word('დღის', DAY)
  word('დღე', DAY)
  word('კვირის', WEEK)
  word('კვირა', WEEK)
  word('თვის', MONTH)
  word('თვე', MONTH)
  word('წლის', YEAR)
  word('წელი', YEAR)

  // Gujarati
  word('સેકંડ', SECOND)
  word('મિનિટ', MINUTE)
  word('કલાક', HOUR)
  word('દિવસ', DAY)
  word('અઠવાડિયા', WEEK)
  word('અઠવાડિયું', WEEK)
  word('મહિના', MONTH)
  word('મહિનો', MONTH)
  word('વર્ષ', YEAR)

  // Icelandic
  word('sekúndum', SECOND)
  word('sekúndu', SECOND)
  word('mínútum', MINUTE)
  word('mínútu', MINUTE)
  word('klukkustundum', HOUR)
  word('klukkustund', HOUR)
  word('dögum', DAY)
  word('degi', DAY)
  word('vikum', WEEK)
  word('viku', WEEK)
  word('mánuðum', MONTH)
  word('mánuði', MONTH)
  word('árum', YEAR)
  word('ári', YEAR)

  // Kazakh
  word('секунд', SECOND)
  word('минут', MINUTE)
  word('сағат', HOUR)
  word('күн', DAY)
  word('апта', WEEK)
  word('ай', MONTH)
  word('жыл', YEAR)

  // Latvian
  word('sekundēm', SECOND)
  word('sekundes', SECOND)
  word('minūtēm', MINUTE)
  word('minūtes', MINUTE)
  word('stundām', HOUR)
  word('stundas', HOUR)
  word('dienām', DAY)
  word('nedēļām', WEEK)
  word('nedēļas', WEEK)
  word('mēnešiem', MONTH)
  word('mēneša', MONTH)
  word('gadiem', YEAR)
  word('gada', YEAR)

  // Lithuanian
  word('sekundžių', SECOND)
  word('minučių', MINUTE)
  word('valandų', HOUR)
  word('valandas', HOUR)
  word('dienas', DAY)
  word('dienų', DAY)
  word('savaites', WEEK)
  word('savaičių', WEEK)
  word('mėnesius', MONTH)
  word('mėnesių', MONTH)
  word('mėnesį', MONTH)
  word('metus', YEAR)
  word('metų', YEAR)

  // Macedonian
  word('дена', DAY)
  word('месеци', MONTH)

  // Marathi
  word('सेकंद', SECOND)
  word('मिनिटे', MINUTE)
  word('मिनिट', MINUTE)
  word('तास', HOUR)
  word('दिवसांपूर्वी', DAY)
  word('दिवस', DAY)
  word('आठवड्यांपूर्वी', WEEK)
  word('आठवडा', WEEK)
  word('महिन्यांपूर्वी', MONTH)
  word('महिन्यापूर्वी', MONTH)
  word('महिना', MONTH)
  word('वर्षांपूर्वी', YEAR)
  word('वर्षापूर्वी', YEAR)
  word('वर्ष', YEAR)

  // Mongolian
  word('секундын', SECOND)
  word('минутын', MINUTE)
  word('цаг', HOUR)
  word('цагийн', HOUR)
  word('өдрийн', DAY)
  word('өдөр', DAY)
  word('хоногийн', DAY)
  word('долоо', WEEK)
  word('сарын', MONTH)
  word('сар', MONTH)
  word('жилийн', YEAR)
  word('жил', YEAR)

  // Punjabi
  word('ਸਕਿੰਟ', SECOND)
  word('ਮਿੰਟ', MINUTE)
  word('ਘੰਟੇ', HOUR)
  word('ਘੰਟਾ', HOUR)
  word('ਦਿਨ', DAY)
  word('ਹਫ਼ਤੇ', WEEK)
  word('ਹਫ਼ਤਾ', WEEK)
  word('ਮਹੀਨੇ', MONTH)
  word('ਮਹੀਨਾ', MONTH)
  word('ਸਾਲ', YEAR)

  // Serbian Cyrillic
  word('секунде', SECOND)
  word('минута', MINUTE)
  word('сата', HOUR)
  word('сати', HOUR)
  word('сат', HOUR)
  word('дана', DAY)
  word('дан', DAY)
  word('недеље', WEEK)
  word('недеља', WEEK)
  word('месеца', MONTH)
  word('месеци', MONTH)
  word('године', YEAR)
  word('година', YEAR)

  // Slovak
  word('sekundami', SECOND)
  word('sekundu', SECOND)
  word('minútami', MINUTE)
  word('minútu', MINUTE)
  word('hodinami', HOUR)
  word('hodinou', HOUR)
  word('dňami', DAY)
  word('dňom', DAY)
  word('týždňami', WEEK)
  word('týždňom', WEEK)
  word('mesiacmi', MONTH)
  word('mesiacom', MONTH)
  word('rokmi', YEAR)
  word('rokom', YEAR)

  // Slovene
  word('sekundo', SECOND)
  word('minutami', MINUTE)
  word('urami', HOUR)
  word('uro', HOUR)
  word('dnevi', DAY)
  word('dnevom', DAY)
  word('tedni', WEEK)
  word('tednom', WEEK)
  word('meseci', MONTH)
  word('mesecem', MONTH)
  word('mesecema', MONTH)
  word('leti', YEAR)
  word('letom', YEAR)

  // Swahili
  word('dakika', MINUTE)
  word('saa', HOUR)
  word('siku', DAY)
  word('wiki', WEEK)
  word('mwezi', MONTH)
  word('miezi', MONTH)
  word('mwaka', YEAR)
  word('miaka', YEAR)

  // Tagalog
  word('oras', HOUR)
  word('araw', DAY)
  word('linggo', WEEK)
  word('buwan', MONTH)
  word('taon', YEAR)

  // Urdu
  word('سیکنڈ', SECOND)
  word('منٹ', MINUTE)
  word('گھنٹے', HOUR)
  word('گھنٹہ', HOUR)
  word('دنوں', DAY)
  word('دن', DAY)
  word('ہفتے', WEEK)
  word('ہفتہ', WEEK)
  word('مہینے', MONTH)
  word('مہینہ', MONTH)
  word('سال', YEAR)

  return TRIE
}

/**
 * CJK time unit keywords
 * Array of [keyword, multiplier] sorted by length (longest first)
 */
const CJK_KEYWORDS = [
  // Japanese (longer patterns first)
  ['週間', WEEK],
  ['か月', MONTH],
  ['ヶ月', MONTH],
  ['時間', HOUR],
  // Chinese
  ['分钟', MINUTE],
  ['分鐘', MINUTE],
  ['小时', HOUR],
  ['小時', HOUR],
  ['个月', MONTH],
  ['個月', MONTH],
  // Korean
  ['시간', HOUR],
  ['개월', MONTH],
  // Single chars (shorter, checked last)
  ['秒', SECOND],
  ['分', MINUTE],
  ['天', DAY],
  ['日', DAY],
  ['周', WEEK],
  ['週', WEEK],
  ['年', YEAR],
  ['초', SECOND],
  ['분', MINUTE], // Korean minutes
  ['일', DAY],
  ['주', WEEK],
  ['년', YEAR],
]

/**
 * Check if text contains Asian characters (CJK, Korean, Thai, etc.)
 */
export function containsAsianCharacters(text) {
  return /[\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(text)
}

/**
 * Extract a number from text
 */
function extractNumber(text) {
  // Convert full-width digits to ASCII digits
  // Full-width: ０１２３４５６７８９ (U+FF10 - U+FF19)
  // ASCII: 0123456789
  const normalizedText = text.replaceAll(/[\uFF10-\uFF19]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0xFF10 + '0'.charCodeAt(0))
  })

  const match = normalizedText.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Parse relative time text in any supported language into seconds.
 * Returns 0 for unparseable strings (sorts to end).
 *
 * @param {string|null} text - The relative time text (e.g., "2 days ago", "vor 3 Tagen")
 * @returns {number} Time in seconds
 */
export function parseRelativeTime(text) {
  if (!text || text.length === 0) {
    return 0
  }

  let num = extractNumber(text)
  num = num === 0 ? 1 : num

  // Handle CJK with contains-based matching (longest match wins)
  if (containsAsianCharacters(text)) {
    for (const [keyword, multiplier] of CJK_KEYWORDS) {
      if (text.includes(keyword)) {
        return num * multiplier
      }
    }
  }

  // Split into words for trie-based keyword matching
  const words = text.toLowerCase().split(/[\d\s]+/).filter(w => w.length > 0)

  const trie = getTrie()

  // Try to match from each position in the word array
  for (let i = 0; i < words.length; i++) {
    const result = trie.lookup(words.slice(i))
    if (result) {
      return num * result[0]
    }
  }

  return 0
}

/**
 * Format seconds into English relative time string (e.g., "2 hours ago")
 * @param {number} seconds - Time in seconds
 * @returns {string}
 */
export function formatRelativeTime(seconds) {
  let value, unit

  if (seconds < MINUTE) {
    value = seconds
    unit = seconds === 1 ? 'second' : 'seconds'
  } else if (seconds < HOUR) {
    value = Math.floor(seconds / MINUTE)
    unit = value === 1 ? 'minute' : 'minutes'
  } else if (seconds < DAY) {
    value = Math.floor(seconds / HOUR)
    unit = value === 1 ? 'hour' : 'hours'
  } else if (seconds < WEEK) {
    value = Math.floor(seconds / DAY)
    unit = value === 1 ? 'day' : 'days'
  } else if (seconds < MONTH) {
    value = Math.floor(seconds / WEEK)
    unit = value === 1 ? 'week' : 'weeks'
  } else if (seconds < YEAR) {
    value = Math.floor(seconds / MONTH)
    unit = value === 1 ? 'month' : 'months'
  } else {
    value = Math.floor(seconds / YEAR)
    unit = value === 1 ? 'year' : 'years'
  }

  return `${value} ${unit} ago`
}
