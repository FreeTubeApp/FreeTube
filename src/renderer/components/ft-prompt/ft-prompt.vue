<template>
  <div
    class="prompt"
    tabindex="-1"
    @click="handleHide"
    @keydown.enter="handleHide"
  >
    <ft-card
      class="promptCard"
      :aria-labelledby="'dialog-' + removeWhitespace(label)"
    >
      <slot>
        <h2
          :id="'dialog-' + removeWhitespace(label)"
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
            :id="'prompt-' + removeWhitespace(label) + '-' + index"
            :key="index"
            :label="option"
            @click="$emit('click', optionValues[index])"
            @keydown.left.prevent="focusItem(index-1)"
            @keydown.right.prevent="focusItem(index+1)"
          />
          <ft-button
            :label="'Close'"
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
