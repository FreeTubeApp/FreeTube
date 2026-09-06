package io.freetubeapp.freetube.webviews

import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import org.json.JSONObject
import java.util.UUID

open class ConsoleLogChromeClient(val onConsoleMessage: (JSONObject) -> Unit): WebChromeClient() {
  override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
    val messageData = JSONObject()
    messageData.put("content", consoleMessage.message())
    messageData.put("level", consoleMessage.messageLevel())
    messageData.put("timestamp", System.currentTimeMillis())
    messageData.put("id", UUID.randomUUID())
    messageData.put("key", "${messageData["id"]}-${messageData["timestamp"]}")
    messageData.put("sourceId", consoleMessage.sourceId())
    messageData.put("lineNumber", consoleMessage.lineNumber())
    onConsoleMessage(messageData)
    return super.onConsoleMessage(consoleMessage)
  }
}
