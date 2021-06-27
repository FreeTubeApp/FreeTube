<template>
  <div
    class="ft-age-restricted"
  >
    <h2 v-html="$t('Age Restricted.This '+contentTypeString+' is age restricted')" />
    <div class="frown">
      {{ emoji }}
    </div>
  </div>
</template>

<script src="./ft-age-restricted.js" />
<style scoped lang="sass" src="./ft-age-restricted.sass" />
