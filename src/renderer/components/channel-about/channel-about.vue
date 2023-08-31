<template>
  <div
    class="about"
  >
    <template
      v-if="description"
    >
      <h2>{{ $t("Channel.About.Channel Description") }}</h2>
      <div
        class="aboutInfo"
        v-html="description"
      />
    </template>
    <template
      v-if="joined || views !== null || location"
    >
      <h2>{{ $t('Channel.About.Details') }}</h2>
      <table
        class="aboutDetails"
      >
        <tr
          v-if="joined"
        >
          <th
            scope="row"
          >
            {{ $t('Channel.About.Joined') }}
          </th>
          <td>{{ formattedJoined }}</td>
        </tr>
        <tr
          v-if="views !== null"
        >
          <th
            scope="row"
          >
            {{ $t('Video.Views') }}
          </th>
          <td>{{ formattedViews }}</td>
        </tr>
        <tr
          v-if="location"
        >
          <th
            scope="row"
          >
            {{ $t('Channel.About.Location') }}
          </th>
          <td>{{ location }}</td>
        </tr>
      </table>
    </template>
    <template
      v-if="tags.length > 0"
    >
      <h2>{{ $t('Channel.About.Tags.Tags') }}</h2>
      <ul
        class="aboutTags"
      >
        <li
          v-for="tag in tags"
          :key="tag"
          class="aboutTag"
        >
          <router-link
            v-if="!hideSearchBar"
            class="aboutTagLink"
            :title="$t('Channel.About.Tags.Search for', { tag })"
            :to="{
              path: `/search/${encodeURIComponent(tag)}`,
              query: searchSettings
            }"
          >
            {{ tag }}
          </router-link>
          <span
            v-else
            class="aboutTagLink"
          >
            {{ tag }}
          </span>
        </li>
      </ul>
    </template>
    <template
      v-if="!hideFeaturedChannels && relatedChannels.length > 0"
    >
      <h2>{{ $t("Channel.About.Featured Channels") }}</h2>
      <ft-flex-box>
        <ft-channel-bubble
          v-for="(channel, index) in relatedChannels"
          :key="index"
          :channel-id="channel.id"
          :channel-name="channel.name"
          :channel-thumbnail="channel.thumbnailUrl"
        />
      </ft-flex-box>
    </template>
  </div>
</template>

<script src="./channel-about.js" />
<style scoped src="./channel-about.css" />
