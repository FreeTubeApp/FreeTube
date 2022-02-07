<template>
  <div>
    <ft-card class="card">
      <h2>{{ $t("Profile.Edit Profile") }}</h2>
      <ft-flex-box>
        <ft-input
          class="profileName"
          placeholder="Profile Name"
          :value="profileName"
          :show-action-button="false"
          @input="e => profileName = e"
        />
      </ft-flex-box>
      <h3>{{ $t("Profile.Color Picker") }}</h3>
      <ft-flex-box
        class="bottomMargin colorOptions"
      >
        <div
          v-for="(color, index) in colorValues"
          :key="index"
          class="colorOption"
          :style="{ background: color }"
          @click="profileBgColor = color"
        />
      </ft-flex-box>
      <ft-flex-box
        class="bottomMargin"
      >
        <div>
          <label for="colorPicker">{{ $t("Profile.Custom Color") }}</label>
          <input
            id="colorPicker"
            v-model="profileBgColor"
            type="color"
          >
        </div>
      </ft-flex-box>
      <ft-flex-box>
        <ft-input
          class="profileName"
          placeholder=""
          :value="profileBgColor"
          :show-action-button="false"
          :disabled="true"
        />
      </ft-flex-box>
      <h3>{{ $t("Profile.Profile Preview") }}</h3>
      <ft-flex-box
        class="bottomMargin"
      >
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
      </ft-flex-box>
      <ft-flex-box>
        <ft-button
          v-if="isNew"
          :label="$t('Profile.Create Profile')"
          @click="saveProfile"
        />
        <ft-button
          v-if="!isNew"
          :label="$t('Profile.Update Profile')"
          @click="saveProfile"
        />
        <ft-button
          v-if="!isNew"
          :label="$t('Profile.Make Default Profile')"
          @click="setDefaultProfile"
        />
        <ft-button
          v-if="!isMainProfile && !isNew"
          :label="$t('Profile.Delete Profile')"
          text-color="var(--text-with-main-color)"
          background-color="var(--primary-color)"
          @click="openDeletePrompt"
        />
      </ft-flex-box>
    </ft-card>
    <ft-prompt
      v-if="showDeletePrompt"
      :label="deletePromptLabel"
      :option-names="deletePromptNames"
      :option-values="deletePromptValues"
      @click="handleDeletePrompt"
    />
  </div>
</template>

<script src="./ft-profile-edit.js" />
<style scoped src="./ft-profile-edit.css" />
