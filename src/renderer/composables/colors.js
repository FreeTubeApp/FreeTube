import { computed } from 'vue'
import { useI18n } from './use-i18n-polyfill'

export function useColorTranslations() {
  const { t } = useI18n()

  return computed(() => [
    t('Settings.Theme Settings.Main Color Theme.Red'),
    t('Settings.Theme Settings.Main Color Theme.Pink'),
    t('Settings.Theme Settings.Main Color Theme.Purple'),
    t('Settings.Theme Settings.Main Color Theme.Deep Purple'),
    t('Settings.Theme Settings.Main Color Theme.Indigo'),
    t('Settings.Theme Settings.Main Color Theme.Blue'),
    t('Settings.Theme Settings.Main Color Theme.Light Blue'),
    t('Settings.Theme Settings.Main Color Theme.Cyan'),
    t('Settings.Theme Settings.Main Color Theme.Teal'),
    t('Settings.Theme Settings.Main Color Theme.Green'),
    t('Settings.Theme Settings.Main Color Theme.Light Green'),
    t('Settings.Theme Settings.Main Color Theme.Lime'),
    t('Settings.Theme Settings.Main Color Theme.Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Amber'),
    t('Settings.Theme Settings.Main Color Theme.Orange'),
    t('Settings.Theme Settings.Main Color Theme.Deep Orange'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Rosewater'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Flamingo'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Pink'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Mauve'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Red'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Maroon'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Peach'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Green'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Teal'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sky'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Sapphire'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Blue'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Mocha Lavender'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Cyan'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Green'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Orange'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Pink'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Purple'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Red'),
    t('Settings.Theme Settings.Main Color Theme.Dracula Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Green'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Blue'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Purple'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Aqua'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Dark Orange'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Light Red'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Light Blue'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Light Purple'),
    t('Settings.Theme Settings.Main Color Theme.Gruvbox Light Orange'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Orange'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Red'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Magenta'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Violet'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Blue'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Cyan'),
    t('Settings.Theme Settings.Main Color Theme.Solarized Green'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Rosewater'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Flamingo'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Pink'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Mauve'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Red'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Maroon'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Peach'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Yellow'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Green'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Teal'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Sky'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Sapphire'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Blue'),
    t('Settings.Theme Settings.Main Color Theme.Catppuccin Frappe Lavender'),
  ])
}
