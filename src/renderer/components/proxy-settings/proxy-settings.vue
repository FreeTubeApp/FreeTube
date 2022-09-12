<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Proxy Settings.Proxy Settings") }}
      </h3>
    </summary>
    <hr>
    <ft-flex-box class="subscriptionSettingsFlexBox">
      <ft-toggle-switch
        :label="$t('Settings.Proxy Settings.Enable Tor / Proxy')"
        :default-value="useProxy"
        @change="handleUpdateProxy"
      />
    </ft-flex-box>
    <div
      v-if="useProxy"
    >
      <ft-flex-box>
        <ft-select
          :placeholder="$t('Settings.Proxy Settings.Proxy Protocol')"
          :value="proxyProtocol"
          :select-names="protocolNames"
          :select-values="protocolValues"
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
        />
        <ft-input
          :placeholder="$t('Settings.Proxy Settings.Proxy Port Number')"
          :show-action-button="false"
          :show-label="true"
          :value="proxyPort"
          @input="handleUpdateProxyPort"
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
          {{ $t('Settings.Proxy Settings.Ip') }}: {{ proxyIp }}
        </p>
        <p>
          {{ $t('Settings.Proxy Settings.Country') }}: {{ proxyCountry }}
        </p>
        <p>
          {{ $t('Settings.Proxy Settings.Region') }}: {{ proxyRegion }}
        </p>
        <p>
          {{ $t('Settings.Proxy Settings.City') }}: {{ proxyCity }}
        </p>
      </div>
    </div>
  </details>
</template>

<script src="./proxy-settings.js" />
<style scoped lang="sass" src="./proxy-settings.sass" />
