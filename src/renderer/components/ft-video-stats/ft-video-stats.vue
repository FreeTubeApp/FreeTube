<template>
  <div class="video-stats">
    <ul>
       <li v-for="(stat,index) in formated_stats" :key="index" >
    {{stat[0]}}: {{stat[1]}}
  </li>
    </ul>
  </div>
</template>

<script src="./ft-video-stats.js" />
