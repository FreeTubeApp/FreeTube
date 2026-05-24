import { MINUTE, HOUR, DAY, WEEK, MONTH, YEAR, parseRelativeTime, isRelativeTime, formatRelativeTime, isHan } from '../relativeTime'

describe('containsAsianCharacters', () => {
  test('returns true for Japanese text', () => {
    expect(isHan('3週間前')).toBe(true)
  })

  test('returns true for Japanese text with spacing', () => {
    expect(isHan('3 週間前')).toBe(true)
  })

  test('returns true for Chinese text', () => {
    expect(isHan('3天前')).toBe(true)
  })

  test('returns true for Korean text', () => {
    expect(isHan('3주 전')).toBe(true)
  })

  test('returns false for English text', () => {
    expect(isHan('3 days ago')).toBe(false)
  })

  test('returns false for German text', () => {
    expect(isHan('vor 3 Tagen')).toBe(false)
  })
})

describe('handlesNonAsciiNumbers', () => {
  test('parses months with full-width digit ８', () => {
    expect(parseRelativeTime('８か月')).toBe(MONTH * 8) // 8 months
  })

  test('parses days with full-width digit ３', () => {
    expect(parseRelativeTime('３日前')).toBe(DAY * 3) // 3 days
  })

  test('parses hours with full-width digit ２', () => {
    expect(parseRelativeTime('２ 時間前')).toBe(HOUR * 2) // 2 hours
  })

  test('parses years with full-width digit １', () => {
    expect(parseRelativeTime('１年前')).toBe(YEAR) // 1 year
  })

  test('parses weeks with full-width digit ５', () => {
    expect(parseRelativeTime('５週間前')).toBe(WEEK * 5) // 5 weeks
  })
})

describe('parseRelativeTime', () => {
  describe('English', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 seconds ago')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minutes ago')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 hours ago')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 days ago')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 weeks ago')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 month ago')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 year ago')).toBe(YEAR)
    })
  })

  describe('German', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('vor 30 Sekunden')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('vor 5 Minuten')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('vor 2 Stunden')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('vor 9 Tagen')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('vor 3 Wochen')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('vor 1 Monat')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('vor 1 Jahr')).toBe(YEAR)
    })
  })

  describe('French', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('il y a 30 secondes')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('il y a 5 minutes')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('il y a 2 heures')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('il y a 9 jours')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('il y a 3 semaines')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('il y a 1 mois')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('il y a 1 an')).toBe(YEAR)
    })
  })

  describe('Japanese', () => {
    test('parses hours', () => {
      expect(parseRelativeTime('2時間前')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('3日前')).toBe(DAY * 3)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3週間前')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('2ヶ月前')).toBe(MONTH * 2)
    })

    test('parses months with full-width digits', () => {
      expect(parseRelativeTime('８か月')).toBe(MONTH * 8)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1年前')).toBe(YEAR)
    })
  })

  describe('Chinese', () => {
    test('parses minutes', () => {
      expect(parseRelativeTime('3分钟前')).toBe(MINUTE * 3)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2小时前')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('3天前')).toBe(DAY * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('2个月前')).toBe(MONTH * 2)
    })

    test('parses months with full-width digits', () => {
      expect(parseRelativeTime('８个月前')).toBe(MONTH * 8) // 8 months in seconds
    })

    test('parses years', () => {
      expect(parseRelativeTime('1年前')).toBe(YEAR)
    })
  })

  describe('Korean', () => {
    test('parses hours', () => {
      expect(parseRelativeTime('2시간 전')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('3일 전')).toBe(DAY * 3)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3주 전')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('2개월 전')).toBe(MONTH * 2)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1년 전')).toBe(YEAR)
    })
  })

  describe('Spanish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('hace 30 segundos')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('hace 5 minutos')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('hace 2 horas')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('hace 9 días')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('hace 3 semanas')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('hace 1 mes')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('hace 1 año')).toBe(YEAR)
    })
  })

  describe('Portuguese', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('há 30 segundos')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('há 5 minutos')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('há 2 horas')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('há 9 dias')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('há 3 semanas')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('há 1 mês')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('há 1 ano')).toBe(YEAR)
    })
  })

  describe('Russian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 секунду назад')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 минут назад')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 часа назад')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 дней назад')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 недели назад')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 месяц назад')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 год назад')).toBe(YEAR)
    })
  })

  describe('Italian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 secondi fa')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minuti fa')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 ore fa')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 giorni fa')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 settimane fa')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 mese fa')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 anno fa')).toBe(YEAR)
    })
  })

  describe('Dutch', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 seconden geleden')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minuten geleden')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 uur geleden')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 dagen geleden')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 weken geleden')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 maand geleden')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 jaar geleden')).toBe(YEAR)
    })
  })

  describe('Polish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 sekund temu')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minut temu')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 godziny temu')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 dni temu')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 tygodnie temu')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 miesiąc temu')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 rok temu')).toBe(YEAR)
    })
  })

  describe('Turkish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 saniye önce')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 dakika önce')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 saat önce')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 gün önce')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 hafta önce')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 ay önce')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 yıl önce')).toBe(YEAR)
    })
  })

  describe('Swedish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('för 30 sekunder sedan')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('för 5 minuter sedan')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('för 2 timmar sedan')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('för 9 dagar sedan')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('för 3 veckor sedan')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('för 1 månad sedan')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('för 1 år sedan')).toBe(YEAR)
    })
  })

  describe('Danish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('for 30 sekunder siden')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('for 5 minutter siden')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('for 2 timer siden')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('for 9 dage siden')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('for 3 uger siden')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('for 1 måned siden')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('for 1 år siden')).toBe(YEAR)
    })
  })

  describe('Norwegian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('for 30 sekunder siden')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('for 5 minutter siden')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('for 2 timer siden')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('for 9 døgn siden')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('for 3 uker siden')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('for 1 måned siden')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('for 1 år siden')).toBe(YEAR)
    })
  })

  describe('Finnish', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 sekuntia sitten')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minuuttia sitten')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 tuntia sitten')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 päivää sitten')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 viikkoa sitten')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 kuukausi sitten')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 vuosi sitten')).toBe(YEAR)
    })
  })

  describe('Greek', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('πριν από 30 δευτερόλεπτα')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('πριν από 5 λεπτά')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('πριν από 2 ώρες')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('πριν από 9 ημέρες')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('πριν από 3 εβδομάδες')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('πριν από 1 μήνα')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('πριν από 1 έτος')).toBe(YEAR)
    })
  })

  describe('Czech', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('před 30 sekundami')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('před 5 minutami')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('před 2 hodinami')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('před 9 dny')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('před 3 týdny')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('před 1 měsícem')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('před 1 rokem')).toBe(YEAR)
    })
  })

  describe('Hungarian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 másodperccel ezelőtt')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 perccel ezelőtt')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 órával ezelőtt')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 nappal ezelőtt')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 héttel ezelőtt')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 hónappal ezelőtt')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 évvel ezelőtt')).toBe(YEAR)
    })
  })

  describe('Romanian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('acum 30 secunde')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('acum 5 minute')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('acum 2 ore')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('acum 9 zile')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('acum 3 săptămâni')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('acum 1 lună')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('acum 1 an')).toBe(YEAR)
    })
  })

  describe('Ukrainian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 секунди тому')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 хвилин тому')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 годин тому')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 днів тому')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 тижні тому')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 місяць тому')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 рік тому')).toBe(YEAR)
    })
  })

  describe('Vietnamese', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 giây trước')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 phút trước')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 giờ trước')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 ngày trước')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 tuần trước')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 tháng trước')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 năm trước')).toBe(YEAR)
    })
  })

  describe('Thai', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 วินาที ที่แล้ว')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 นาที ที่แล้ว')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 ชั่วโมง ที่แล้ว')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 วันที่ผ่านมา')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 สัปดาห์ที่ผ่านมา')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 เดือนที่ผ่านมา')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 ปีที่แล้ว')).toBe(YEAR)
    })
  })

  describe('Indonesian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 detik yang lalu')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 menit yang lalu')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 jam yang lalu')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 hari yang lalu')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 minggu yang lalu')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 bulan yang lalu')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 tahun yang lalu')).toBe(YEAR)
    })
  })

  describe('Malay', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 saat lalu')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minit lalu')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 jam lalu')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 hari lalu')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 minggu lalu')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 bulan lalu')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 tahun lalu')).toBe(YEAR)
    })
  })

  describe('Azerbaijani', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 saniyə öncə')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 dəqiqə öncə')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 saat öncə')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 gün öncə')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 həftə öncə')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 ay öncə')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 il öncə')).toBe(YEAR)
    })
  })

  describe('Hebrew', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('לפני 30 שניות')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('לפני 5 דקות')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('לפני 2 שעות')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('לפני 9 ימים')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('לפני 3 שבועות')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('לפני חודש (1)')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('לפני שנה')).toBe(YEAR)
    })
  })

  describe('Arabic', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('قبل 30 ثانية')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('قبل 5 دقائق')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('قبل 2 ساعات')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('قبل 9 أيام')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('قبل 3 أسابيع')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('قبل شهر واحد')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('قبل سنة واحدة')).toBe(YEAR)
    })
  })

  describe('Hindi', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 सेकंड पहले')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 मिनट पहले')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 घंटे पहले')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 दिन पहले')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 सप्ताह पहले')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 माह पहले')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 वर्ष पहले')).toBe(YEAR)
    })
  })

  describe('Bengali', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 সেকেন্ড আগে')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 মিনিট আগে')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 ঘন্টা আগে')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 দিন আগে')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 সপ্তাহ আগে')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 মাস আগে')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 বছর পূর্বে')).toBe(YEAR)
    })
  })

  describe('Tamil', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 வினாடி முன்')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 நிமிடம் முன்')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 மணிநேரம் முன்')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 நாட்களுக்கு முன்')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 வாரங்களுக்கு முன்')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 மாதத்துக்கு முன்')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 ஆண்டிற்கு முன்')).toBe(YEAR)
    })
  })

  describe('Telugu', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 సెకను క్రితం')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 నిమిషం క్రితం')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 గంట క్రితం')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 రోజుల క్రితం')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 వారాల క్రితం')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 నెల క్రితం')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 సంవత్సరం క్రితం')).toBe(YEAR)
    })
  })

  describe('Afrikaans', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 sekonde gelede')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minute gelede')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 uur gelede')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 dae gelede')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 weke gelede')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 maand gelede')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 jaar gelede')).toBe(YEAR)
    })
  })

  describe('Armenian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 վայրկան առաջ')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 րոպե առաջ')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 ժամ առաջ')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 օր առաջ')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 շաբաթ առաջ')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 ամիս առաջ')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 տարի առաջ')).toBe(YEAR)
    })
  })

  describe('Basque', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('duela 30 segundo')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('duela 5 minutu')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('duela 2 ordu')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('duela 9 egun')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('duela 3 aste')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('duela 1 hilabete')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('duela 1 urte')).toBe(YEAR)
    })
  })

  describe('Belarusian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 секунд таму')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 хвілін таму')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 гадзіны таму')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 дзён таму')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 тыдні таму')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 месяц таму')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 год таму')).toBe(YEAR)
    })
  })

  describe('Bosnian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('prije 30 sekundi')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('prije 5 minuta')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('prije 2 sata')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('prije 9 dana')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('prije 3 sedmice')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('prije 1 mjesec')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('prije 1 godinu')).toBe(YEAR)
    })
  })

  describe('Bulgarian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('преди 30 секунди')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('преди 5 минути')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('преди 2 часа')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('преди 9 дни')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('преди 3 седмици')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('преди 1 месец')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('преди 1 година')).toBe(YEAR)
    })
  })

  describe('Catalan', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('fa 30 segons')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('fa 5 minuts')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('fa 2 hores')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('fa 9 dies')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('fa 3 setmanes')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('fa 1 mes')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('fa 1 any')).toBe(YEAR)
    })
  })

  describe('Croatian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('prije 30 sekundi')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('prije 5 minuta')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('prije 2 sata')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('prije 9 dana')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('prije 3 tjedna')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('prije 1 mjesec')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('prije 1 godinu')).toBe(YEAR)
    })
  })

  describe('Estonian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 sekundit eest')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minutit eest')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 tundi eest')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 päeva eest')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 nädala eest')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 kuu eest')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 aasta eest')).toBe(YEAR)
    })
  })

  describe('Georgian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 წამის წინ')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 წუთის წინ')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 საათის წინ')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 დღის წინ')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 კვირის წინ')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 თვის წინ')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 წლის წინ')).toBe(YEAR)
    })
  })

  describe('Gujarati', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 સેકંડ પહેલાં')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 મિનિટ પહેલાં')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 કલાક પહેલાં')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 દિવસ પહેલાં')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 અઠવાડિયા પહેલાં')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 મહિના પહેલાં')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 વર્ષ પહેલાં')).toBe(YEAR)
    })
  })

  describe('Icelandic', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('fyrir 30 sekúndum')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('fyrir 5 mínútum')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('fyrir 2 klukkustundum')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('fyrir 9 dögum')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('fyrir 3 vikum')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('fyrir 1 mánuði')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('fyrir 1 ári')).toBe(YEAR)
    })
  })

  describe('Kazakh', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 секунд бұрын')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 минут бұрын')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 сағат бұрын')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 күн бұрын')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 апта бұрын')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 ай бұрын')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 жыл бұрын')).toBe(YEAR)
    })
  })

  describe('Latvian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('pirms 30 sekundēm')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('pirms 5 minūtēm')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('pirms 2 stundām')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('pirms 9 dienām')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('pirms 3 nedēļām')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('pirms 1 mēneša')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('pirms 1 gada')).toBe(YEAR)
    })
  })

  describe('Lithuanian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('prieš 30 sekundžių')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('prieš 5 minutes')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('prieš 2 valandas')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('prieš 9 dienas')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('prieš 3 savaites')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('prieš 1 mėnesį')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('prieš 1 metus')).toBe(YEAR)
    })
  })

  describe('Macedonian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('пред 30 секунди')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('пред 5 минути')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('пред 2 часа')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('пред 9 дена')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('пред 3 седмици')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('пред 1 месец')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('пред 1 година')).toBe(YEAR)
    })
  })

  describe('Marathi', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 सेकंद पूर्वी')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 मिनिटे पूर्वी')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 तास पूर्वी')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 दिवसांपूर्वी')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 आठवड्यांपूर्वी')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 महिन्यापूर्वी')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 वर्षापूर्वी')).toBe(YEAR)
    })
  })

  describe('Mongolian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 секундын өмнө')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 минутын өмнө')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 цагийн өмнө')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 өдрийн өмнө')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 долоо хоногийн өмнө')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 сарын өмнө')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 жилийн өмнө')).toBe(YEAR)
    })
  })

  describe('Punjabi', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 ਸਕਿੰਟ ਪਹਿਲਾਂ')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 ਮਿੰਟ ਪਹਿਲਾਂ')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 ਘੰਟੇ ਪਹਿਲਾਂ')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 ਦਿਨ ਪਹਿਲਾਂ')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 ਹਫ਼ਤੇ ਪਹਿਲਾਂ')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 ਮਹੀਨਾ ਪਹਿਲਾਂ')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 ਸਾਲ ਪਹਿਲਾਂ')).toBe(YEAR)
    })
  })

  describe('Serbian', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('пре 30 секунде')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('пре 5 минута')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('пре 2 сата')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('пре 9 дана')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('пре 3 недеље')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('пре 1 месеца')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('пре 1 године')).toBe(YEAR)
    })
  })

  describe('Slovak', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('pred 30 sekundami')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('pred 5 minútami')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('pred 2 hodinami')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('pred 9 dňami')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('pred 3 týždňami')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('pred 1 mesiacom')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('pred 1 rokom')).toBe(YEAR)
    })
  })

  describe('Slovene', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('pred 30 sekundami')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('pred 5 minutami')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('pred 2 urami')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('pred 4 dnevi')).toBe(DAY * 4)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('pred 3 tedni')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('pred 1 mesecem')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('pred 1 letom')).toBe(YEAR)
    })
  })

  describe('Swahili', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('sekunde 30 zilizopita')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('dakika 5 zilizopita')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('saa 2 zilizopita')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('siku 9 zilizopita')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('wiki 3 zilizopita')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('mwezi 1 uliopita')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('mwaka 1 uliopita')).toBe(YEAR)
    })
  })

  describe('Tagalog', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 segundo ang nakalipas')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 minuto ang nakalipas')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 oras ang nakalipas')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 araw ang nakalipas')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 linggo ang nakalipas')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 buwan ang nakalipas')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 taon ang nakalipas')).toBe(YEAR)
    })
  })

  describe('Urdu', () => {
    test('parses seconds', () => {
      expect(parseRelativeTime('30 سیکنڈ پہلے')).toBe(30)
    })

    test('parses minutes', () => {
      expect(parseRelativeTime('5 منٹ پہلے')).toBe(MINUTE * 5)
    })

    test('parses hours', () => {
      expect(parseRelativeTime('2 گھنٹے پہلے')).toBe(HOUR * 2)
    })

    test('parses days', () => {
      expect(parseRelativeTime('9 دنوں پہلے')).toBe(DAY * 9)
    })

    test('parses weeks', () => {
      expect(parseRelativeTime('3 ہفتے پہلے')).toBe(WEEK * 3)
    })

    test('parses months', () => {
      expect(parseRelativeTime('1 مہینہ پہلے')).toBe(MONTH)
    })

    test('parses years', () => {
      expect(parseRelativeTime('1 سال پہلے')).toBe(YEAR)
    })
  })

  describe('edge cases', () => {
    test('defaults to 1 day ago when no number is present', () => {
      expect(parseRelativeTime('a day ago')).toBe(DAY)
      expect(parseRelativeTime('il öncə')).toBe(YEAR)
    })

    test('returns 0 for null', () => {
      expect(parseRelativeTime(null)).toBe(0)
    })

    test('returns 0 for empty string', () => {
      expect(parseRelativeTime('')).toBe(0)
    })

    test('returns 0 for unparseable text', () => {
      expect(parseRelativeTime('something random')).toBe(0)
    })
  })
})

describe('isRelativeTime', () => {
  describe('English', () => {
    test('returns true for seconds', () => {
      expect(isRelativeTime('30 seconds ago')).toBe(true)
    })

    test('returns true for minutes', () => {
      expect(isRelativeTime('5 minutes ago')).toBe(true)
    })

    test('returns true for hours', () => {
      expect(isRelativeTime('2 hours ago')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('9 days ago')).toBe(true)
    })

    test('returns true for weeks', () => {
      expect(isRelativeTime('3 weeks ago')).toBe(true)
    })

    test('returns true for months', () => {
      expect(isRelativeTime('1 month ago')).toBe(true)
    })

    test('returns true for years', () => {
      expect(isRelativeTime('1 year ago')).toBe(true)
    })

    test('returns true for text without numbers', () => {
      expect(isRelativeTime('a day ago')).toBe(true)
    })
  })

  describe('German', () => {
    test('returns true for seconds', () => {
      expect(isRelativeTime('vor 30 Sekunden')).toBe(true)
    })

    test('returns true for minutes', () => {
      expect(isRelativeTime('vor 5 Minuten')).toBe(true)
    })

    test('returns true for hours', () => {
      expect(isRelativeTime('vor 2 Stunden')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('vor 9 Tagen')).toBe(true)
    })
  })

  describe('French', () => {
    test('returns true for hours', () => {
      expect(isRelativeTime('il y a 2 heures')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('il y a 9 jours')).toBe(true)
    })
  })

  describe('Spanish', () => {
    test('returns true for hours', () => {
      expect(isRelativeTime('hace 2 horas')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('hace 9 días')).toBe(true)
    })
  })

  describe('Japanese', () => {
    test('returns true for seconds', () => {
      expect(isRelativeTime('30秒前')).toBe(true)
    })

    test('returns true for minutes', () => {
      expect(isRelativeTime('5分前')).toBe(true)
    })

    test('returns true for hours', () => {
      expect(isRelativeTime('2時間前')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('3日前')).toBe(true)
    })

    test('returns true for weeks', () => {
      expect(isRelativeTime('3週間前')).toBe(true)
    })

    test('returns true for months', () => {
      expect(isRelativeTime('８か月')).toBe(true)
    })

    test('returns true for years', () => {
      expect(isRelativeTime('１年前')).toBe(true)
    })
  })

  describe('Chinese', () => {
    test('returns true for seconds', () => {
      expect(isRelativeTime('30秒前')).toBe(true)
    })

    test('returns true for minutes', () => {
      expect(isRelativeTime('5分钟前')).toBe(true)
    })

    test('returns true for hours', () => {
      expect(isRelativeTime('2小时前')).toBe(true)
    })

    test('returns true for days', () => {
      expect(isRelativeTime('3天前')).toBe(true)
    })

    test('returns true for weeks', () => {
      expect(isRelativeTime('3周前')).toBe(true)
    })

    test('returns true for months', () => {
      expect(isRelativeTime('8个月前')).toBe(true)
    })

    test('returns true for years', () => {
      expect(isRelativeTime('1年前')).toBe(true)
    })
  })

  describe('non-relative time strings', () => {
    test('returns false for plain text', () => {
      expect(isRelativeTime('something random')).toBe(false)
    })

    test('returns false for regular date', () => {
      expect(isRelativeTime('January 15, 2024')).toBe(false)
    })

    test('returns false for ISO date string', () => {
      expect(isRelativeTime('2024-01-15')).toBe(false)
    })

    test('returns false for text with numbers but no time keywords', () => {
      expect(isRelativeTime('I have 5 apples')).toBe(false)
    })

    test('returns false for random CJK text', () => {
      expect(isRelativeTime('これはテストです')).toBe(false)
    })
  })

  describe('edge cases', () => {
    test('returns false for null', () => {
      expect(isRelativeTime(null)).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(isRelativeTime('')).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isRelativeTime(undefined)).toBe(false)
    })

    test('returns false for whitespace only', () => {
      expect(isRelativeTime('   ')).toBe(false)
    })

    test('returns true for text with extra whitespace', () => {
      expect(isRelativeTime('2  hours  ago')).toBe(true)
    })
  })
})

describe('formatRelativeTime', () => {
  test('formats seconds', () => {
    expect(formatRelativeTime(30)).toBe('30 seconds ago')
  })

  test('formats single second', () => {
    expect(formatRelativeTime(1)).toBe('1 second ago')
  })

  test('formats minutes', () => {
    expect(formatRelativeTime(MINUTE * 5)).toBe('5 minutes ago')
  })

  test('formats single minute', () => {
    expect(formatRelativeTime(MINUTE)).toBe('1 minute ago')
  })

  test('formats hours', () => {
    expect(formatRelativeTime(HOUR * 2)).toBe('2 hours ago')
  })

  test('formats single hour', () => {
    expect(formatRelativeTime(HOUR)).toBe('1 hour ago')
  })

  test('formats days', () => {
    expect(formatRelativeTime(DAY * 3)).toBe('3 days ago')
  })

  test('formats single day', () => {
    expect(formatRelativeTime(DAY)).toBe('1 day ago')
  })

  test('formats weeks', () => {
    expect(formatRelativeTime(WEEK * 3)).toBe('3 weeks ago')
  })

  test('formats single week', () => {
    expect(formatRelativeTime(WEEK)).toBe('1 week ago')
  })

  test('formats months', () => {
    expect(formatRelativeTime(MONTH * 2)).toBe('2 months ago')
  })

  test('formats single month', () => {
    expect(formatRelativeTime(MONTH)).toBe('1 month ago')
  })

  test('formats years', () => {
    expect(formatRelativeTime(YEAR * 2)).toBe('2 years ago')
  })

  test('formats single year', () => {
    expect(formatRelativeTime(YEAR)).toBe('1 year ago')
  })
})
