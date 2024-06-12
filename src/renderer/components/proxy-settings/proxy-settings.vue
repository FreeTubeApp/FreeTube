<template>
  <ft-settings-section
    :title="$t('Settings.Proxy Settings.Proxy Settings')"
  >
    <ft-flex-box class="settingsFlexStart500px">
      <ft-toggle-switch
        :label="$t('Settings.Proxy Settings.Enable Tor / Proxy')"
        :default-value="useProxy"
        @change="handleUpdateProxy"
      />
    </ft-flex-box>
    <template
      v-if="useProxy"
    >
      <ft-flex-box>
        <ft-select
          :placeholder="$t('Settings.Proxy Settings.Proxy Protocol')"
          :value="proxyProtocol"
          :select-names="protocolNames"
          :select-values="protocolValues"
          class="protocol-dropdown"
          :icon="['fas', 'network-wired']"
          @change="handleUpdateProxyProtocol"
        />
      </ft-flex-box>
      <ft-flex-box>
        <ft-input
          :placeholder="$t('Settings.Proxy Settings.Proxy Host')"
          :show-action-button="false"
          :show-label="true"
          :value="proxyHostname"
          @input="handleUpdateProxyHostname"
          @keydown.enter.native="testProxy"
        />
        <ft-input
          :placeholder="$t('Settings.Proxy Settings.Proxy Port Number')"
          :show-action-button="false"
          :show-label="true"
          :value="proxyPort"
          :maxlength="5"
          @input="handleUpdateProxyPort"
          @keydown.enter.native="testProxy"
        />
      </ft-flex-box>
      <p
        class="center"
        :style="{opacity: useProxy ? 1 : 0.4}"
      >
        {{ $t('Settings.Proxy Settings.Clicking on Test Proxy will send a request to') }} {{ proxyTestUrl }}
      </p>
      <ft-flex-box>
        <ft-button
          :label="$t('Settings.Proxy Settings.Test Proxy')"
          @click="testProxy"
        />
      </ft-flex-box>
      <ft-loader
        v-if="isLoading"
      />
      <div
        v-if="!isLoading && dataAvailable"
        class="center"
      >
        <h3>
          {{ $t('Settings.Proxy Settings.Your Info') }}
        </h3>
        <p>
          {{ $t('Display Label', { label: $t('Settings.Proxy Settings.Ip'), value: proxyIp }) }}
        </p>
        <p>
          {{ $t('Display Label', { label: $t('Settings.Proxy Settings.Country'), value: proxyCountry }) }}
        </p>
        <p>
          {{ $t('Display Label', { label: $t('Settings.Proxy Settings.Region'), value: proxyRegion }) }}
        </p>
        <p>
          {{ $t('Display Label', { label: $t('Settings.Proxy Settings.City'), value: proxyCity }) }}
        </p>
      </div>
    </template>
  </ft-settings-section>
</template>

<script src="./proxy-settings.js" />
<style scoped src="./proxy-settings.css" />
