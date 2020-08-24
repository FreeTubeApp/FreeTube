<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-else
    >
      <ft-card class="card">
        <h2>{{ $t("Profile.Edit Profile") }}</h2>
        <ft-flex-box>
          <ft-input
            class="profileName"
            placeholder="Profile Name"
            :value="profileName"
            :show-arrow="false"
            @input="e => profileName = e"
          />
        </ft-flex-box>
        <h3>{{ $t("Profile.Color Picker") }}</h3>
        <ft-flex-box
          class="bottomMargin"
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
              type="color"
              v-model="profileBgColor"
            />
          </div>
        </ft-flex-box>
        <ft-flex-box>
          <ft-input
            class="profileName"
            placeholder=""
            :value="profileBgColor"
            :show-arrow="false"
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
            <p
              class="initial"
            >
              {{ profileInitial }}
            </p>
          </div>
        </ft-flex-box>
        <ft-flex-box>
          <ft-button
            :label="$t('Profile.Update Profile')"
            @click="saveProfile"
          />
          <ft-button
            :label="$t('Profile.Make Default Profile')"
            @click="saveProfile"
          />
          <ft-button
            :label="$t('Profile.Delete Profile')"
            text-color="var(--text-with-main-color)"
            background-color="var(--primary-color)"
            @click="saveProfile"
          />
        </ft-flex-box>
      </ft-card>
    </div>
  </div>
</template>

<script src="./ProfileEdit.js" />
<style scoped src="./ProfileEdit.css" />
