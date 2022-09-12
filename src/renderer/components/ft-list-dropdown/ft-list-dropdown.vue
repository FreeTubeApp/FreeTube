<template>
  <div class="dropDown">
    <div class="buttonTitle">
      {{ title }}
      <font-awesome-icon
        class="angleDownIcon"
        :icon="['fas', 'angle-down']"
      />
    </div>
    <ul>
      <li
        v-for="(label, index) in labelNames"
        :key="index"
        class="buttonOption"
        @click="$emit('click', labelValues[index])"
      >
        {{ label }}
      </li>
    </ul>
  </div>
</template>

<script src="./ft-list-dropdown.js" />
<style scoped src="./ft-list-dropdown.css" />
