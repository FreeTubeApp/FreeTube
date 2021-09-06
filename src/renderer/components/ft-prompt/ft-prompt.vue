<template>
  <div
    class="prompt"
    tabindex="-1"
    @click="handleHide"
    @keydown.enter="handleHide"
  >
    <ft-card
      class="promptCard"
      :aria-labelledby="'dialog-' + $unspace(label)"
    >
      <slot>
        <h2
          :id="'dialog-' + $unspace(label)"
          class="center"
        >
          {{ label }}
        </h2>
        <ft-flex-box>
          <ft-button
            v-for="(option, index) in optionNames"
            :key="index"
            :label="option"
            @click="$emit('click', optionValues[index])"
          />
        </ft-flex-box>
      </slot>
    </ft-card>
  </div>
</template>

<script src="./ft-prompt.js" />
<style scoped src="./ft-prompt.css" />
