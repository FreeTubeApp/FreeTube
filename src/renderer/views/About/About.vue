<template>
  <div>
    <ft-card class="card center">
      <h3 class="leftAlign">
        {{ $t("About.About") }}
      </h3>
      <img
        src="_icons/logoColor.png"
        class="logo"
      >
      <h1>
        {{ versionNumber }} {{ $t("About.Beta") }}
      </h1>
      <h3>
        {{ $t("About.License") }}:
        <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPLv3</a>
      </h3>
    </ft-card>
    <ft-card class="card center">
      <h3 class="leftAlign">
        {{ $t("About.Contact") }}
      </h3>
      <h3>
        <font-awesome-icon
          icon="envelope"
          :title="$t('About.Email')"
        />
        &nbsp;&nbsp;FreeTubeApp@protonmail.com
      </h3>
      <h3>
        <font-awesome-icon
          :icon="['fab', 'mastodon']"
          title="Mastodon"
        />
        &nbsp;&nbsp;<a href="https://mastodon.technology/@FreeTube">@FreeTube@mastodon.technology</a>
      </h3>
      <h3>
        <font-awesome-icon
          icon="comments"
          title="Matrix"
        />
        &nbsp;&nbsp;<a href="https://matrix.to/#/+freetube:matrix.org">#freetube:matrix.org</a> <a href="https://github.com/FreeTubeApp/FreeTube/wiki/Matrix-Channel-Info-&-Rules">({{ $t("About.Channel Rules") }})</a>
      </h3>
    </ft-card>
    <ft-card class="card center">
      <h3 class="leftAlign">
        {{ $t("About.Help") }}
      </h3>
      <ft-button
        :label="$t('About.Report an Issue')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube/issues')"
      />
      <ft-button
        :label="$t('About.Wiki')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube/wiki')"
      />
      <ft-button
        :label="$t('About.FAQ')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube/wiki/F.A.Q.')"
      />
    </ft-card>
    <ft-card class="card center">
      <h3 class="leftAlign">
        {{ $t("About.Useful Links") }}
      </h3>
      <ft-button
        :label="$t('About.Credits')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube/wiki/Credits')"
      />
      <ft-button
        :label="$t('About.Blog')"
        @click="openUrl('https://freetube.writeas.com/')"
      />
      <ft-button
        :label="$t('About.Release Notes')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube/releases')"
      />
      <ft-button
        :label="$t('About.Source Code')"
        @click="openUrl('https://github.com/FreeTubeApp/FreeTube')"
      />
      <ft-button
        :label="$t('About.Website')"
        @click="openUrl('https://freetubeapp.io/')"
      />
      <ft-button
        :label="$t('About.Translate via Weblate')"
        @click="openUrl('https://hosted.weblate.org/engage/free-tube/')"
      />
    </ft-card>
    <ft-card class="card center">
      <h3 class="leftAlign">
        {{ $t("About.Donate") }}
      </h3>
      <h4>
        <font-awesome-icon
          icon="donate"
        />
        &nbsp;&nbsp;<a href="https://liberapay.com/FreeTube">Liberapay</a>
      </h4>
      <h4>
        <font-awesome-icon
          :icon="['fab', 'bitcoin']"
        />
        &nbsp;&nbsp;BTC: 1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS
      </h4>
      <h4>
        <font-awesome-icon
          :icon="['fab', 'monero']"
        />
        &nbsp;&nbsp;XMR: 48WyAPdjwc6VokeXACxSZCFeKEXBiYPV6GjfvBsfg4CrUJ95LLCQSfpM9pvNKy5GE5H4hNaw99P8RZyzmaU9kb1pD7kzhCB
      </h4>
    </ft-card>
  </div>
</template>

<script src="./About.js" />
<style scoped src="./About.css" />
