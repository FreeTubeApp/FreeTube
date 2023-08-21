<template>
  <div
    class="prompt"
    tabindex="-1"
    @click="handleHide"
    @keydown.enter="handleHide"
  >
    <ft-card
      class="promptCard"
      :class="{ autosize }"
      :aria-labelledby="('dialog-' + sanitizedLabel)"
    >
      <slot>
        <h2
          :id="'dialog-' + sanitizedLabel"
          class="center"
        >
          {{ label }}
        </h2>
        <p
          v-for="extraLabel in extraLabels"
          :key="extraLabel"
          class="center"
        >
          <strong>
            {{ extraLabel }}
          </strong>
        </p>
        <ft-flex-box>
          <ft-button
            v-for="(option, index) in optionNames"
            :id="'prompt-' + sanitizedLabel + '-' + index"
            :key="index"
            :label="option"
            @click="$emit('click', optionValues[index])"
          />
          <ft-button
            v-if="showClose"
            :id="'prompt-' + sanitizedLabel + '-close'"
            :label="$t('Close')"
            tabindex="0"
            text-color="'var(--accent-color)'"
            background-color="'var(--text-with-accent-color)'"
            @click="hide"
          />
        </ft-flex-box>
      </slot>
    </ft-card>
  </div>
</template>

<script src="./ft-prompt.js" />
<style scoped src="./ft-prompt.css" />
