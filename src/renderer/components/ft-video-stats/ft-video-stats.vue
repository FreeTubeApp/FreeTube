<template>
  <div class="video-stats">
    <ul>
      <li>video_id = {{ stats.video_id }} </li>
      <li>player_resolution = {{ stats.player_resolution }} </li>
      <li>frame_drop = {{ stats.frame_drop }} </li>
      <li>volume = {{ stats.volume }} </li>
      <li>network_state = {{ stats.network_state }} </li>
      <li>network_speed = {{ stats.network_speed }} </li>
      <li>bandwidth = {{ stats.bandwidth }} </li>
      <li>buffer_time = {{ stats.buffer_time }} </li>
      <li>buffer_percent = {{ stats.buffer_percent }} </li>
      <li>fps = {{ stats.fps }} </li>
    </ul>
  </div>
</template>

<script src="./ft-video-stats.js" />
