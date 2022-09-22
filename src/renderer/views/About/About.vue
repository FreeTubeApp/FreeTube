<template>
  <div>
    <ft-card class="card">
      <h1>
        {{ $t("About.About") }}
      </h1>
      <section class="brand">
        <img
          src="../../../../_icons/logoColor.png"
          class="logo"
        >
        <div class="version">
          {{ versionNumber }} {{ $t("About.Beta") }}
        </div>
      </section>
      <section class="about-chunks">
        <figure
          v-for="chunk in chunks"
          :key="chunk.title"
          class="chunk"
        >
          <font-awesome-icon
            class="icon"
            :icon="chunk.icon"
          />
          <h3 class="title">
            {{ chunk.title }}
          </h3>
          <div
            class="content"
            v-html="chunk.content"
          />
        </figure>
      </section>
    </ft-card>
  </div>
</template>

<script src="./About.js" />
<style scoped src="./About.sass" lang="sass" />
