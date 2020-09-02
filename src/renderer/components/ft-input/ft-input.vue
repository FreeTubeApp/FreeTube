<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor
    }"
  >
    <label
      v-if="showLabel"
      :for="id"
    >
      {{ placeholder }}
    </label>
    <input
      :id="id"
      v-model="inputData"
      :list="idDataList"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="e => handleInput(e.target.value)"
    >
    <font-awesome-icon
      v-if="showArrow"
      icon="arrow-right"
      class="inputAction"
      @click="handleClick"
    />
    <datalist
      v-if="dataList.length > 0"
      :id="idDataList"
    >
      <option
        v-for="(list, index) in dataList"
        :key="index"
        :value="list"
      />
    </datalist>
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
