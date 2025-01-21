<template>
  <div class="select">
    <select
      :id="sanitizedId ?? sanitizedPlaceholder"
      ref="select"
      :aria-describedby="describeById"
      class="select-text"
      :class="{disabled: disabled}"
      :value="value"
      :name="sanitizedId ?? sanitizedPlaceholder"
      :disabled="disabled"
      @change="change($event.target.value)"
    >
      <option
        v-for="(name, index) in selectNames"
        :key="index"
        :value="selectValues[index]"
        :lang="isLocaleSelector && selectValues[index] !== 'system' ? selectValues[index] : null"
      >
        {{ name }}
      </option>
    </select>
    <font-awesome-icon
      :icon="['fas', 'sort-down']"
      class="iconSelect"
    />
    <span class="select-highlight" />
    <span class="select-bar" />
    <label
      v-if="!disabled"
      class="select-label"
      :for="sanitizedId ?? sanitizedPlaceholder"
    >
      <font-awesome-icon
        :icon="icon"
        class="select-icon"
        :color="iconColor"
      />
      {{ placeholder }}
    </label>
    <ft-tooltip
      v-if="tooltip !== ''"
      class="selectTooltip"
      :tooltip="tooltip"
    />
  </div>
</template>

<script src="./ft-select.js" />
<style scoped src="./ft-select.css" />
