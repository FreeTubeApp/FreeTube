<template>
  <div
    class="ft-input-tags-component"
  >
    <div
      v-if="disabled"
      class="disabledMsg"
    >
      {{ disabledMsg }}
    </div>
    <FtInput
      ref="tagNameInput"
      :disabled="disabled"
      :placeholder="tagNamePlaceholder"
      :label="label"
      :min-input-length="minInputLength"
      :show-label="true"
      :tooltip="tooltip"
      :show-action-button="true"
      :select-on-focus="true"
      :force-action-button-icon-name="['fas', 'arrow-right']"
      @click="updateTags"
    />
    <div
      v-if="tagList.length >= 1"
      class="checkbox-container"
    >
      <input
        :id="id"
        type="checkbox"
        :checked="showTags"
        @change="toggleShowTags"
      >
      <label :for="id">
        {{ t('Settings.Distraction Free Settings.Show Added Items') }}
      </label>
    </div>
    <div
      v-if="showTags"
      class="ft-tag-box"
    >
      <ul>
        <li
          v-for="tag in tagList"
          :key="tag.id"
        >
          <template v-if="areChannelTags">
            <RouterLink
              v-if="tag.icon"
              :to="tag.iconHref ?? ''"
              class="tag-icon-link"
            >
              <img
                :src="tag.icon"
                alt=""
                class="tag-icon"
                height="24"
                width="24"
                loading="lazy"
              >
            </RouterLink>
            <bdi>{{ (tag.preferredName) ? tag.preferredName : tag.name }}</bdi>
          </template>
          <bdi v-else>{{ tag }}</bdi>
          <button
            v-if="!disabled"
            class="removeTagButton"
            @click="removeTag(tag)"
          >
            <FontAwesomeIcon
              :icon="['fas', 'fa-times']"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useId, useTemplateRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtInput from '../FtInput/FtInput.vue'

import { showToast } from '../../helpers/utils'

const props = defineProps({
  areChannelTags: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  disabledMsg: {
    type: String,
    default: ''
  },
  tagNamePlaceholder: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  minInputLength: {
    type: Number,
    default: 1
  },
  showTags: {
    type: Boolean,
    default: true
  },
  tagList: {
    type: Array,
    default: () => []
  },
  tooltip: {
    type: String,
    default: ''
  },
  validateTagName: {
    type: Function,
    default: (_) => true
  },
  findTagInfo: {
    type: Function,
    default: (_) => ({ preferredName: '', icon: '' }),
  }
})

const emit = defineEmits(['already-exists', 'change', 'error-find-tag-info', 'invalid-name', 'toggle-show-tags'])

const { t } = useI18n()

const id = useId()

const tagNameInput = useTemplateRef('tagNameInput')

/**
 * @param {string} text
 */
async function updateTags(text) {
  if (props.areChannelTags) {
    await updateChannelTags(text)
    return
  }

  // add tag and update tag list
  const trimmedText = text.trim()

  if (props.minInputLength > trimmedText.length) {
    showToast(t('Trimmed input must be at least N characters long', { length: props.minInputLength }, props.minInputLength))
    return
  }

  if (props.tagList.includes(trimmedText)) {
    showToast(t('Tag already exists', { tagName: trimmedText }))
    return
  }

  const newList = props.tagList.slice()
  newList.push(trimmedText)
  emit('change', newList)
  // clear input box
  tagNameInput.value.clear()
}

/**
 * @param {string} text
 */
async function updateChannelTags(text) {
  // get text without spaces after last '/' in url, if any
  const name = text.split('/').at(-1).trim()

  if (!props.validateTagName(name)) {
    emit('invalid-name')
    return
  }

  if (!props.tagList.some((tag) => tag.name === name)) {
    // tag info searching allow api calls to be used
    const { preferredName, icon, iconHref, err } = await props.findTagInfo(name)

    if (err) {
      emit('error-find-tag-info')
      return
    }

    const newTag = { name, preferredName, icon, iconHref }
    emit('change', [...props.tagList, newTag])
  } else {
    emit('already-exists')
  }

  // clear input box
  tagNameInput.value.clear()
}

function removeTag(tag) {
  if (props.areChannelTags) {
    removeChannelTag(tag)
    return
  }

  // Remove tag from list
  const tagName = tag.trim()
  const index = props.tagList.indexOf(tagName)

  if (index !== -1) {
    const newList = props.tagList.slice(0)
    newList.splice(index, 1)
    emit('change', newList)
  }
}

function removeChannelTag(tag) {
  // Remove tag from list
  if (props.tagList.some((tmpTag) => tmpTag.name === tag.name)) {
    const newList = props.tagList.filter((tmpTag) => tmpTag.name !== tag.name)
    emit('change', newList)
  }
}

function toggleShowTags() {
  emit('toggle-show-tags')
}
</script>

<style scoped src="./FtInputTags.css" />
