<template>
  <div>
    <ft-card class="card center">
      <h3 class="leftAlign">
        About
      </h3>
      <img
        src="_icons/logoColor.png"
        class="logo"
      >
      <h1>
        {{ versionNumber }} Alpha
      </h1>
      <h3>
        <font-awesome-icon
          icon="envelope"
        />
        &nbsp;&nbsp;FreeTubeApp@protonmail.com
      </h3>
      <h2>
        This software is FOSS and released under the
        <a href="https://www.gnu.org/licenses/quick-guide-gplv3.html">GNU Public License v3+</a>.
      </h2>
      <p>
        Found a bug? Want to suggest a feature? Want to help out? Check out our
        <a href="https://github.com/FreeTubeApp/FreeTube">GitHub</a>
        page. Pull requests are welcome.
      </p>
      <p>
        Thank you very much to the
        <a href="https://github.com/FreeTubeApp/FreeTube/wiki/Credits">People and Projects</a>
        that make FreeTube possible!
      </p>
      <p>
        Want to chat? Join our
        <a href="https://app.element.io/#/group/+freetube:matrix.org">Element / Matrix Server</a>
        . Please check the
        <a href="https://github.com/FreeTubeApp/FreeTube/wiki/Matrix-Server-Info-&-Rules">rules</a>
        before joining.
      </p>
      <p>
        Looking for help? Check out our
        <a href="https://github.com/FreeTubeApp/FreeTube/wiki">Wiki</a>
        page.
      </p>
      <p>
        Check out our
        <a href="https://addons.mozilla.org/en-US/firefox/addon/freetube-redirect/">Firefox</a>
        extension!
      </p>
      <p>
        If you enjoy using FreeTube, consider donating via
        <a href="https://liberapay.com/FreeTube">Liberapay</a>
        or through our Bitcoin address.
      </p>
      <p>
        BTC: 1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS
      </p>
    </ft-card>
  </div>
</template>

<script src="./About.js" />
<style scoped src="./About.css" />
