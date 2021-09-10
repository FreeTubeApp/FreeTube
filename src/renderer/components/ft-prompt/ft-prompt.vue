<template>
  <div
    class="prompt"
    @click="handleHide"
  >
    <ft-card class="promptCard">
      <slot>
        <h2 class="center">
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
