package io.freetubeapp.freetube.helpers

import org.json.JSONObject

data class ApplicationState(
  val consoleMessages: MutableList<JSONObject> = mutableListOf(),
  var showSplashScreen: Boolean = true,
  var darkMode: Boolean = false,
  var paused: Boolean = false,
  var isInAPrompt: Boolean = false,
  var keepScreenOn: Boolean = false,
  var currentPage: String? = null
)
