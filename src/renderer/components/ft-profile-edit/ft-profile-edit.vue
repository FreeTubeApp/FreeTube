<template>
  <div>
    <ft-card class="card">
      <h2>{{ editOrCreateProfileLabel }}</h2>
      <ft-flex-box class="profileEdit">
        <div>
          <h3>{{ $t("Profile.Color Picker") }}</h3>
          <ft-flex-box
            class="colorOptions"
          >
            <div
              v-for="(color, index) in colorValues"
              :key="index"
              class="colorOption"
              :title="color + ' ' + $t('Profile.Custom Color')"
              :style="{ background: color }"
              tabindex="0"
              @click="profileBgColor = color"
              @keydown.space.prevent="profileBgColor = color"
              @keydown.enter.prevent="profileBgColor = color"
            />
          </ft-flex-box>
          <div class="customColorSection">
            <label for="colorPicker">{{ $t("Profile.Custom Color") }}</label>
            <input
              id="colorPicker"
              v-model="profileBgColor"
              type="color"
            >
          </div>
          <ft-input
            class="colorSelection"
            placeholder=""
            :value="profileBgColor"
            :show-action-button="false"
            :disabled="true"
          />
        </div>
        <div class="secondEditRow">
          <div>
            <h3>{{ editOrCreateProfileNameLabel }}</h3>
            <ft-input
              class="profileName"
              :placeholder="$t('Profile.Profile Name')"
              :disabled="isMainProfile"
              :value="translatedProfileName"
              :show-action-button="false"
              :maxlength="100"
              @input="e => profileName = e"
              @keydown.enter.native="saveProfile"
            />
          </div>
          <div>
            <h3>{{ $t("Profile.Profile Preview") }}</h3>
            <div class="profilePreviewSection">
              <div
                class="colorOption"
                :style="{ background: profileBgColor, color: profileTextColor }"
                style="cursor: default"
              >
                <div
                  class="initial"
                >
                  {{ profileInitial }}
                </div>
              </div>
              <ft-flex-box>
                <ft-button
                  v-if="isNew"
                  :label="$t('Profile.Create Profile')"
                  @click="saveProfile"
                />
                <template
                  v-else
                >
                  <ft-button
                    :label="$t('Profile.Update Profile')"
                    @click="saveProfile"
                  />
                  <ft-button
                    :label="$t('Profile.Make Default Profile')"
                    @click="setDefaultProfile"
                  />
                  <ft-button
                    v-if="!isMainProfile"
                    :label="$t('Profile.Delete Profile')"
                    text-color="var(--destructive-text-color)"
                    background-color="var(--destructive-color)"
                    :icon="['fas', 'trash']"
                    @click="openDeletePrompt"
                  />
                </template>
              </ft-flex-box>
            </div>
          </div>
        </div>
      </ft-flex-box>
    </ft-card>
    <ft-prompt
      v-if="showDeletePrompt"
      :label="deletePromptLabel"
      :option-names="deletePromptNames"
      :option-values="deletePromptValues"
      :is-first-option-destructive="true"
      @click="handleDeletePrompt"
    />
  </div>
</template>

<script src="./ft-profile-edit.js" />
<style scoped src="./ft-profile-edit.css" />
