<template>
  <ul class="channelBlockerSettingsBlockedList">
    <li
      v-for="item in data"
      :key="item._id"
      class="channelBlockerSettingsBlockedListItem"
    >
      <span
        class="channelBlockerSettingsBlockedListButton"
        @click="handleIconClick(item._id)"
      >
        <font-awesome-icon
          icon="times"
        />
      </span>
      <span
        class="channelBlockerSettingsBlockedListName"
      >
        <a
          class="channelName"
          :href="`#/channel/${item._id}`"
        >
          {{ item.name }}
        </a>
      </span>
    </li>
  </ul>
</template>

<script src="./channel-blocker-settings-list.js" />
<style scoped src="./channel-blocker-settings-list.css" />
