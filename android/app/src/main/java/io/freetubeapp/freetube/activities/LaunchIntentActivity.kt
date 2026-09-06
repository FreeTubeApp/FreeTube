package io.freetubeapp.freetube.activities

import android.content.Intent
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import io.freetubeapp.freetube.helpers.Promise

open class LaunchIntentActivity: AppCompatActivity() {
  private val activityResultListeners: MutableList<(ActivityResult?) -> Unit> = mutableListOf()
  private val activityResultLauncher: ActivityResultLauncher<Intent> = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
    for (listener in activityResultListeners) {
      listener(it)
    }
    // clear the listeners
    activityResultListeners.removeAll { true }
  }
  private fun listenForActivityResults(listener: (ActivityResult?) -> Unit) {
    activityResultListeners.add(listener)
  }
  fun launchIntent(intent: Intent): Promise<ActivityResult?, Exception> {
    return Promise { resolve, reject ->
      try {
        listenForActivityResults {
          resolve(it)
        }
        activityResultLauncher.launch(intent)
      } catch (exception: Exception) {
        reject(exception)
      }
    }
  }
}
