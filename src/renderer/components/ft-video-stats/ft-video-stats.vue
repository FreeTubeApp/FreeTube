<template>
  <div class="video-stats">
    <ul>
      <li>{{ stats.video_id }} </li>
      <li>{{ stats.volume }} </li>
      <li>{{ stats.buffer_time }} </li>
      <li>{{ stats.buffer_percent }} </li>
      <li>{{ stats.player_resolution }} </li>
    </ul>
  </div>
</template>

<script src="./ft-video-stats.js" />
