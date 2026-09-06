package io.freetubeapp.freetube.helpers

import android.content.res.AssetManager
import java.io.BufferedReader
import java.io.InputStreamReader

fun AssetManager.readText(assetName: String) : String {
  val lines = mutableListOf<String>()
  val reader = BufferedReader(InputStreamReader(open(assetName)))
  try {
    var line = reader.readLine()
    while(line != null) {
      lines.add(line)
      line = reader.readLine()
    }
  } catch (ex: Exception) {
    ex.printStackTrace()
  } finally {
    try {
      reader.close()
    } catch (ex: Exception) {
      ex.printStackTrace()
    }
  }
  return lines.joinToString("\n")
}
