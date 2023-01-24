<template>
  <div class="select">
    <select
      :id="sanitizedId ?? sanitizedPlaceholder"
      :describe-by-id="describeById"
      class="select-text"
      :class="{disabled: disabled}"
      :value="value"
      :name="sanitizedId ?? sanitizedPlaceholder"
      :disabled="disabled"
      @change="$emit('change', $event.target.value)"
    >
      <option
        v-for="(name, index) in selectNames"
        :key="index"
        :value="selectValues[index]"
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
      class="select-label"
      :for="sanitizedId ?? sanitizedPlaceholder"
      :hidden="disabled"
    >
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
