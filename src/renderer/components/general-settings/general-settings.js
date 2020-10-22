import Vue from 'vue'
import $ from 'jquery'
import FS from 'fs'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import debounce from 'lodash.debounce'

export default Vue.extend({
  name: 'GeneralSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      showInvidiousInstances: false,
      instanceNames: [],
      instanceValues: [],
      currentLocale: '',
      currentGeoLocation: '',
      geoLocationArray: [],
      backendValues: [
        'invidious',
        'local'
      ],
      defaultPageNames: [
        'Subscriptions',
        'Trending',
        'Most Popular',
        'Playlists',
        'History'
      ],
      defaultPageValues: [
        'subscriptions',
        'trending',
        'mostPopular',
        'playlists',
        'history'
      ],
      viewTypeValues: [
        'grid',
        'list'
      ],
      thumbnailTypeValues: [
        '',
        'start',
        'middle',
        'end'
      ],
      regionNames: [
        'Afghanistan',
        'Albania',
        'Algeria',
        'American Samoa',
        'Andorra',
        'Angola',
        'Antarctica',
        'Antigua And Barbuda',
        'Argentina',
        'Armenia',
        'Aruba',
        'Australia',
        'Austria',
        'Azerbaijan',
        'Bahamas',
        'Bahrain',
        'Bangladesh',
        'Barbados',
        'Belarus',
        'Belgium',
        'Belize',
        'Benin',
        'Bermuda',
        'Bhutan',
        'Bolivia',
        'Bosnia And Herzegovina',
        'Botswana',
        'Bouvet Island',
        'Brazil',
        'British Indian Ocean Territory',
        'Brunei Darussalam',
        'Bulgaria',
        'Burkina Faso',
        'Burundi',
        'Cambodia',
        'Cameroon',
        'Canada',
        'Cape Verde',
        'Cayman Islands',
        'Central African Republic',
        'Chad',
        'Chile',
        'China',
        'Christmas Island',
        'Cocos (Keeling) Islands',
        'Colombia',
        'Comoros',
        'Congo',
        'Congo, The Democratic Republic Of The',
        'Cook Islands',
        'Costa Rica',
        "Cote D'Ivoire",
        'Croatia',
        'Cuba',
        'Cyprus',
        'Czech Republic',
        'Denmark',
        'Djibouti',
        'Dominica',
        'Dominican Republic',
        'Ecuador',
        'Egypt',
        'El Salvador',
        'Equatorial Guinea',
        'Eritrea',
        'Estonia',
        'Ethiopia',
        'Falkland Islands (Malvinas)',
        'Faroe Islands',
        'Fiji',
        'Finland',
        'France',
        'French Guiana',
        'French Polynesia',
        'French Southern Territories',
        'Gabon',
        'Gambia',
        'Georgia',
        'Germany',
        'Ghana',
        'Gibraltar',
        'Greece',
        'Greenland',
        'Grenada',
        'Guadeloupe',
        'Guam',
        'Guatamala',
        'Guinea',
        'Guinea-Bissau',
        'Guyana',
        'Haiti',
        'Heard Island And McDonald Islands',
        'Honduras',
        'Hong Kong',
        'Hungary',
        'Iceland',
        'India',
        'Indonesia',
        'Iran, Islamic Republic Of',
        'Iraq',
        'Ireland',
        'Israel',
        'Italy',
        'Jamaica',
        'Japan',
        'Jordan',
        'Kazakhstan',
        'Kenya',
        'Kiribati',
        "Korea, Democratic People's Republic Of",
        'Korea, Republic Of',
        'Kuwait',
        'Kyrgyzstan',
        "Lao People's Democratic Republic (LAOS)",
        'Latvia',
        'Lebonon',
        'Lesotho',
        'Liberia',
        'Libyan Arab Jamahiriya',
        'Liechtenstein',
        'Lithuania',
        'Luxembourg',
        'Macao',
        'Macedonia, The Former Yugoslav Republic Of',
        'Madagascar',
        'Malawi',
        'Malaysia',
        'Maldives',
        'Mali',
        'Malta',
        'Marshall Islands',
        'Martinique',
        'Mauritania',
        'Mauritius',
        'Mayotte',
        'Mexico',
        'Micronesia, Federated States Of',
        'Moldova, Republic Of',
        'Monaco',
        'Mongolia',
        'Montenegro',
        'Montserrat',
        'Morocco',
        'Mozambique',
        'Myanmar',
        'Namibia',
        'Nauru',
        'Nepal',
        'Netherlands',
        'Netherlands Antilles',
        'New Caledonia',
        'New Zealand',
        'Nicaragua',
        'Niger',
        'Nigeria',
        'Niue',
        'Norfolk Island',
        'Northern Mariana Islands',
        'Norway',
        'Oman',
        'Pakistan',
        'Palau',
        'Palestinian Territory, Occupied',
        'Panama',
        'Papua New Guinea',
        'Paraguay',
        'Peru',
        'Philippines',
        'Pitcair',
        'Poland',
        'Portugal',
        'Puerto Rico',
        'Qatar',
        'Reunion',
        'Romania',
        'Russian Federation',
        'Rwanda',
        'Saint Helena',
        'Saint Kitts And Nevis',
        'Saint Lucia',
        'Saint Pierre And Miquelon',
        'Saint Vincent And The Grenadines',
        'Samoa',
        'San Marina',
        'Sao Tome And Principe',
        'Saudi Arabia',
        'Senegal',
        'Serbia',
        'Seychelles',
        'Sierra Leone',
        'Singapore',
        'Slovakia',
        'Slovenia',
        'Solomon Islands',
        'Somalia',
        'South Africa',
        'South Georgia And The South Sandwich Islands',
        'Spain',
        'Sri Lanka',
        'Sudan',
        'Suriname',
        'Svalbard And Jan Mayen',
        'Swaziland',
        'Sweden',
        'Switzerland',
        'Syrian Arab Republic',
        'Taiwan',
        'Tajikistan',
        'Tanzania, United Republic Of',
        'Thailand',
        'Timor-Leste',
        'Togo',
        'Tokelau',
        'Tonga',
        'Trinidad And Tobago',
        'Tunisia',
        'Turkey',
        'Turkenistan',
        'Turks And Caicos Islands',
        'Tuvalu',
        'Uganda',
        'Ukraine',
        'United Arab Emirates',
        'United Kingdom',
        'United States',
        'United States Minor Outlying Islands',
        'Uruguay',
        'Uzbekistan',
        'Vanuatu',
        'Venezuela',
        'Viet Nam',
        'Virgin Islands, British',
        'Virgin Islands, U.S.',
        'Wallis And Futuna',
        'Western Sahara',
        'Yemen',
        'Zambia',
        'Zimbabwe'
      ],
      regionValues: [
        'AF',
        'AL',
        'DZ',
        'AS',
        'AD',
        'AO',
        'AQ',
        'AG',
        'AR',
        'AM',
        'AW',
        'AU',
        'AT',
        'AZ',
        'BS',
        'BH',
        'BD',
        'BB',
        'BY',
        'BE',
        'BZ',
        'BJ',
        'BM',
        'BT',
        'BO',
        'BA',
        'BW',
        'BV',
        'BR',
        'IO',
        'BN',
        'BG',
        'BF',
        'BI',
        'KH',
        'CM',
        'CA',
        'CV',
        'KY',
        'CF',
        'TD',
        'CL',
        'CN',
        'CX',
        'CC',
        'CO',
        'KM',
        'CG',
        'CD',
        'CK',
        'CR',
        'CI',
        'HR',
        'CU',
        'CY',
        'CZ',
        'DK',
        'DJ',
        'DM',
        'DO',
        'EC',
        'EG',
        'SV',
        'GQ',
        'ER',
        'EE',
        'ET',
        'FK',
        'FO',
        'FJ',
        'FI',
        'FR',
        'GF',
        'PF',
        'TF',
        'GA',
        'GM',
        'GE',
        'DE',
        'GH',
        'GI',
        'GR',
        'GL',
        'GD',
        'GP',
        'GU',
        'GT',
        'GN',
        'GW',
        'GY',
        'HT',
        'HM',
        'HN',
        'HK',
        'HU',
        'IS',
        'IN',
        'ID',
        'IR',
        'IQ',
        'IE',
        'IL',
        'IT',
        'JM',
        'JP',
        'JO',
        'KZ',
        'KE',
        'KI',
        'KP',
        'KR',
        'KW',
        'KG',
        'LA',
        'LV',
        'LB',
        'LS',
        'LR',
        'LY',
        'LI',
        'LT',
        'LU',
        'MO',
        'MK',
        'MG',
        'MW',
        'MY',
        'MV',
        'ML',
        'MT',
        'MH',
        'MQ',
        'MR',
        'MU',
        'YT',
        'MX',
        'FM',
        'MD',
        'MC',
        'MN',
        'ME',
        'MS',
        'MA',
        'MZ',
        'MM',
        'NA',
        'NR',
        'NP',
        'NL',
        'AN',
        'NC',
        'NZ',
        'NI',
        'NE',
        'NG',
        'NU',
        'NF',
        'MP',
        'NO',
        'OM',
        'PK',
        'PW',
        'PS',
        'PA',
        'PG',
        'PY',
        'PE',
        'PH',
        'PN',
        'PL',
        'PT',
        'PR',
        'QA',
        'RE',
        'RO',
        'RU',
        'RW',
        'SH',
        'KN',
        'LC',
        'PM',
        'VC',
        'WS',
        'SM',
        'ST',
        'SA',
        'SN',
        'RS',
        'SC',
        'SL',
        'SG',
        'SK',
        'SI',
        'SB',
        'SO',
        'ZA',
        'GS',
        'ES',
        'LK',
        'SD',
        'SR',
        'SJ',
        'SZ',
        'SE',
        'CH',
        'SY',
        'TW',
        'TJ',
        'TZ',
        'TH',
        'TL',
        'TG',
        'TK',
        'TO',
        'TT',
        'TN',
        'TR',
        'TM',
        'TC',
        'TV',
        'UG',
        'UA',
        'AE',
        'GB',
        'US',
        'UM',
        'UY',
        'UZ',
        'VU',
        'VE',
        'VN',
        'VG',
        'VI',
        'WF',
        'EH',
        'YE',
        'ZM',
        'ZW'
      ]
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    checkForUpdates: function () {
      return this.$store.getters.getCheckForUpdates
    },
    checkForBlogPosts: function () {
      return this.$store.getters.getCheckForBlogPosts
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    landingPage: function () {
      return this.$store.getters.getLandingPage
    },
    region: function () {
      return this.$store.getters.getRegion
    },
    listType: function () {
      return this.$store.getters.getListType
    },
    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },

    localeOptions: function () {
      return Object.keys(this.$i18n.messages)
    },

    localeNames: function () {
      const names = []

      Object.keys(this.$i18n.messages).forEach((locale) => {
        const localeName = this.$i18n.messages[locale]['Locale Name']
        if (typeof localeName !== 'undefined') {
          names.push(localeName)
        } else {
          names.push(locale)
        }
      })

      return names
    },
    geoLocationOptions: function () {
      return this.geoLocationArray.map((entry) => { return entry.code })
    },
    geoLocationNames: function () {
      return this.geoLocationArray.map((entry) => { return entry.name })
    },

    backendNames: function () {
      return [
        this.$t('Settings.General Settings.Preferred API Backend.Invidious API'),
        this.$t('Settings.General Settings.Preferred API Backend.Local API')
      ]
    },

    viewTypeNames: function () {
      return [
        this.$t('Settings.General Settings.Video View Type.Grid'),
        this.$t('Settings.General Settings.Video View Type.List')
      ]
    },

    thumbnailTypeNames: function () {
      return [
        this.$t('Settings.General Settings.Thumbnail Preference.Default'),
        this.$t('Settings.General Settings.Thumbnail Preference.Beginning'),
        this.$t('Settings.General Settings.Thumbnail Preference.Middle'),
        this.$t('Settings.General Settings.Thumbnail Preference.End')
      ]
    }
  },
  mounted: function () {
    const requestUrl = 'https://instances.invidio.us/instances.json'
    $.getJSON(requestUrl, (response) => {
      console.log(response)
      const instances = response.filter((instance) => {
        if (instance[0].includes('.onion') || instance[0].includes('.i2p') || instance[0].includes('yewtu.be')) {
          return false
        } else {
          return true
        }
      })

      this.instanceNames = instances.map((instance) => {
        return instance[0]
      })

      this.instanceValues = instances.map((instance) => {
        return instance[1].uri.replace(/\/$/, '')
      })

      this.showInvidiousInstances = true
    }).fail((xhr, textStatus, error) => {
      console.log(xhr)
      console.log(textStatus)
      console.log(requestUrl)
      console.log(error)
    })

    this.updateInvidiousInstanceBounce = debounce(this.updateInvidiousInstance, 500)

    this.currentLocale = this.$i18n.locale
    this.currentGeoLocation = this.$i18n.geoLocation
    if (this.currentGeoLocation === undefined) {
      this.updateGeoLocationNames(this.currentLocale)
      this.currentGeoLocation = 'us'
    }
  },
  beforeDestroy: function () {
    if (this.invidiousInstance === '') {
      this.updateInvidiousInstance('https://invidious.snopyta.org')
    }
  },
  methods: {
    handleInvidiousInstanceInput: function (input) {
      const invidiousInstance = input.replace(/\/$/, '')
      this.updateInvidiousInstanceBounce(invidiousInstance)
    },

    handlePreferredApiBackend: function (backend) {
      this.updateBackendPreference(backend)
      console.log(backend)

      if (backend === 'local') {
        this.updateForceLocalBackendForLegacy(false)
      }
    },

    updateLocale: function (locale) {
      this.$i18n.locale = locale
      this.currentLocale = locale
      localStorage.setItem('locale', locale)
      this.updateGeoLocationNames(locale)
    },

    updateGeoLocation: function (location) {
      this.$i18n.geoLocation = location
      this.currentGeoLocation = location
      localStorage.setItem('geoLocation', location)
    },

    updateGeoLocationNames: function (locale) {
      let fileData
      const fileLocation = this.isDev ? '.' : `${__dirname}`
      if (FS.existsSync(`${fileLocation}/static/geolocations/${locale}`)) {
        fileData = FS.readFileSync(`${fileLocation}/static/geolocations/${locale}/countries.json`)
      } else {
        fileData = FS.readFileSync(`${fileLocation}/static/geolocations/en-US/countries.json`)
      }
      const countries = JSON.parse(fileData).map((entry) => { return { id: entry.id, name: entry.name, code: entry.alpha2 } })
      countries.sort((a, b) => { return a.id - b.id })
      this.geoLocationArray = countriess
    },

    ...mapActions([
      'updateEnableSearchSuggestions',
      'updateBackendFallback',
      'updateCheckForUpdates',
      'updateCheckForBlogPosts',
      'updateBarColor',
      'updateBackendPreference',
      'updateLandingPage',
      'updateRegion',
      'updateListType',
      'updateThumbnailPreference',
      'updateInvidiousInstance',
      'updateForceLocalBackendForLegacy'
    ])
  }
})
