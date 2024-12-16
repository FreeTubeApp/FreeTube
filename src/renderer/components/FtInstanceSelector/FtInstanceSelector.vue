<template>
  <div>
    <FtFlexBox
      class="settingsFlexStart460px"
    >
      <FtInput
        :placeholder="placeholder"
        :show-action-button="false"
        :show-label="true"
        :value="currentInstance"
        :data-list="instanceList"
        :tooltip="tooltip"
        @input="handleInstanceInput"
      />
    </FtFlexBox>
    <FtFlexBox>
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
    </FtFlexBox>
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
    <FtFlexBox>
      <FtButton
        :label="$t('Settings.General Settings.Set Current Instance as Default')"
        @click="setDefaultInstance"
      />
      <FtButton
        :label="$t('Settings.General Settings.Clear Default Instance')"
        @click="clearDefaultInstance"
      />
    </FtFlexBox>
  </div>
</template>

<script setup>
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtButton from '../ft-button/ft-button.vue'

defineProps({
  placeholder: {
    type: String,
    required: true
  },
  tooltip: {
    type: String,
    required: true
  },
  backendType: {
    type: String,
    required: true
  },
  currentInstance: {
    type: String,
    required: true
  },
  instanceList: {
    type: Array,
    required: true
  },
  defaultInstance: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['clearDefaultInstance', 'input', 'setDefaultInstance'])

function handleInstanceInput(inputData) {
  emit('input', inputData)
}

function setDefaultInstance() {
  emit('setDefaultInstance')
}
function clearDefaultInstance() {
  emit('clearDefaultInstance')
}

</script>
