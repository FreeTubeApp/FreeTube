<template>
  <ft-card
    class="relative card">
    <h3
      class="videoTitle"
    >
      {{ title }}
    </h3>
    <ft-flex-box>
      <ft-toggle-switch
        label="Hide Videos When Watched"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        placeholder="Subscription View Type"
        :value="viewValues[0]"
        :select-names="viewNames"
        :select-values="viewValues"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-button
        label="Manage My Subscriptions"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./subscription-settings.js" />
<style scoped src="./subscription-settings.css" />
