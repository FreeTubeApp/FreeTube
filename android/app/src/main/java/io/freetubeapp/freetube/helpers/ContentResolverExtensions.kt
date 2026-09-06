package io.freetubeapp.freetube.helpers

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns

enum class WriteMode {
  Truncate,
  Append
}

fun ContentResolver.readBytes(uri: Uri): ByteArray? {
  val stream = openInputStream(uri)
  val content = stream?.readBytes()
  stream?.close()
  return content
}

fun ContentResolver.writeBytes(uri: Uri, bytes: ByteArray, writeMode: WriteMode = WriteMode.Truncate) {
  val mode = when (writeMode) {
      WriteMode.Truncate -> {
        "wt"
      }
      WriteMode.Append -> {
        "wa"
      }
  }
  val stream = openOutputStream(uri, mode)
  stream?.write(bytes)
  stream?.flush()
  stream?.close()
}

fun ContentResolver.getFileName(uri: Uri): String {
  var result: String? = null
  val cursor = query(uri,  null, null, null, null)
  cursor.use { cursor ->
    if (cursor != null && cursor.moveToFirst()) {
      val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
      if (index != -1) {
        result = cursor.getString(index)
      }
    }
  }

  return result ?: uri.toString().split(Regex("(/)|(%2F)")).last()
}
