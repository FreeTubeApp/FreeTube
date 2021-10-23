<template>
  <div class="sponsorBlockCategory">
    <h2>
      {{ $t("Video.Sponsor Block category."+categoryName) }}
    </h2>
    <ft-select
      :placeholder="$t('Settings.SponsorBlock Settings.Category Color')"
      :value="sponsorBlockValues.color"
      :select-names="colorNames"
      :select-values="colorValues"
      @change="updateColor"
    />
    <ft-select
      :placeholder="$t('Settings.SponsorBlock Settings.Skip Options.Skip Option')"
      :value="sponsorBlockValues.skip"
      :select-names="skipNames"
      :select-values="skipValues"
      @change="updateSkipOption"
    />
  </div>
</template>
<script src="./ft-sponsor-block-category.js" />
<style scoped lang="sass" src="./ft-sponsor-block-category.sass" />
