<template>
  <div
    class="ft-age-restricted"
  >
    <h2>
      {{ $t('Age Restricted.This '+contentTypeString+' is age restricted') }}
    </h2>
    <div class="frown">
      {{ emoji }}
    </div>
  </div>
</template>

<script src="./ft-age-restricted.js" />
<style scoped lang="sass" src="./ft-age-restricted.sass" />
