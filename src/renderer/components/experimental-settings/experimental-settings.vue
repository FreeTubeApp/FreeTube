<template>
  <details>
    <summary>
      <h3>
        {{ $t('Settings.Experimental Settings.Experimental Settings') }}
      </h3>
    </summary>
    <hr>
    <ft-flex-box>
      <p class="experimental-warning">
        {{ $t('Settings.Experimental Settings.Warning') }}
      </p>
      <ft-toggle-switch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Replace HTTP Cache')"
        :compact="true"
        :default-value="replaceHttpCache"
        :disabled="replaceHttpCacheLoading"
        :tooltip="$t('Tooltips.Experimental Settings.Replace HTTP Cache')"
        @change="handleRestartPrompt"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showRestartPrompt"
      :label="restartPromptMessage"
      :option-names="restartPromptNames"
      :option-values="restartPromptValues"
      @click="handleReplaceHttpCache"
    />
  </details>
</template>

<script src="./experimental-settings.js" />
<style scoped lang="sass" src="./experimental-settings.sass" />
