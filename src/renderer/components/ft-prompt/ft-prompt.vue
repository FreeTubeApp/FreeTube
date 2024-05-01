<template>
  <portal to="promptPortal">
    <div
      ref="openPrompt"
      class="prompt"
      tabindex="-1"
      @click="handleHide"
      @keydown.enter="handleHide"
    >
      <ft-card
        class="promptCard"
        :class="{ autosize, [theme]: true }"
        role="dialog"
        aria-modal="true"
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
              :text-color="optionButtonTextColor(index)"
              :background-color="optionButtonBackgroundColor(index)"
              :icon="index === 0 && isFirstOptionDestructive ? ['fas', 'trash'] : null"
              @click="click(optionValues[index])"
            />
          </ft-flex-box>
        </slot>
      </ft-card>
    </div>
  </portal>
</template>

<script src="./ft-prompt.js" />
<style scoped src="./ft-prompt.css" />
