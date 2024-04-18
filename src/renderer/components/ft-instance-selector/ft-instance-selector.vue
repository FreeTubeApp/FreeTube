<template>
  <div>
    <ft-flex-box
      class="settingsFlexStart460px"
    >
      <ft-input
        :placeholder="placeholder"
        :show-action-button="false"
        :show-label="true"
        :value="currentInstance"
        :data-list="instanceList"
        :tooltip="tooltip"
        @input="handleInstanceInput"
      />
    </ft-flex-box>
    <ft-flex-box>
      <div v-if="backendType === 'piped'">
        <a href="https://github.com/TeamPiped/Piped/wiki/Instances">
          {{ $t('Settings.General Settings.View all Piped instance information') }}
        </a>
      </div>
      <div
        v-else-if="backendType === 'invidious'"
      >
        <a
          href="https://api.invidious.io"
        >
          {{ $t('Settings.General Settings.View all Invidious instance information') }}
        </a>
      </div>
    </ft-flex-box>
    <p
      v-if="defaultInstance !== ''"
      class="center"
    >
      {{ $t('Settings.General Settings.The currently set default instance is {instance}', {
        instance: defaultInstance
      }) }}
    </p>
    <template v-else>
      <p
        class="center"
      >
        {{ $t('Settings.General Settings.No default instance has been set') }}
      </p>
      <p
        class="center"
      >
        {{ $t('Settings.General Settings.Current instance will be randomized on startup') }}
      </p>
    </template>
    <ft-flex-box>
      <ft-button
        :label="$t('Settings.General Settings.Set Current Instance as Default')"
        @click="setDefaultInstance"
      />
      <ft-button
        :label="$t('Settings.General Settings.Clear Default Instance')"
        @click="clearDefaultInstance"
      />
    </ft-flex-box>
  </div>
</template>

<script src="./ft-instance-selector"></script>
