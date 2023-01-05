<template>
  <div class="sponsorBlockCategory">
    <div
      :id="sanitizedId"
      class="sponsorTitle"
    >
      {{ $t("Video.Sponsor Block category." + categoryName) }}
    </div>
    <ft-select
      :sanitized-id="sanitizedId + 'categoryColor'"
      :describe-by-id="sanitizedId"
      :placeholder="$t('Settings.SponsorBlock Settings.Category Color')"
      :value="sponsorBlockValues.color"
      :select-names="colorNames"
      :select-values="colorValues"
      @change="updateColor"
    />
    <ft-select
      :sanitized-id="sanitizedId + 'skipOption'"
      :describe-by-id="sanitizedId"
      :placeholder="$t('Settings.SponsorBlock Settings.Skip Options.Skip Option')"
      :value="sponsorBlockValues.skip"
      :select-names="skipNames"
      :select-values="skipValues"
      @change="updateSkipOption"
    />
  </div>
</template>
<script src="./ft-sponsor-block-category.js" />
<style scoped lang="scss" src="./ft-sponsor-block-category.scss" />
