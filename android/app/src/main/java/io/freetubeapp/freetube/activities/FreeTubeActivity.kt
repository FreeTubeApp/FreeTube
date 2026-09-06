package io.freetubeapp.freetube.activities

import android.content.Intent
import android.graphics.Canvas
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.addCallback
import androidx.core.graphics.createBitmap
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import io.freetubeapp.freetube.helpers.ApplicationState
import io.freetubeapp.freetube.helpers.hexToColour

open class FreeTubeActivity: LaunchIntentActivity() {
  private lateinit var windowInsetsControllerCompat: WindowInsetsControllerCompat
  val state = ApplicationState()
  val windowInsetsController: WindowInsetsControllerCompat
    get() {
      return windowInsetsControllerCompat
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    windowInsetsControllerCompat = WindowCompat.getInsetsController(window, window.decorView)
    onBackPressedDispatcher.addCallback {
      onBack()
    }
  }

  open fun onBack() {

  }

  fun restart() {
    finish()
    startActivity(Intent(Intent.ACTION_MAIN)
      .addCategory(Intent.CATEGORY_LAUNCHER)
      .setClass(this,  this::class.java))
  }

  fun setKeepScreenOn(newState: Boolean) {
    if (state.keepScreenOn != newState) {
      state.keepScreenOn = newState
      runOnUiThread {
        if (state.keepScreenOn) {
          window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
          window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
      }
    }
  }

  fun themeSystemUi(navigationHex: String, statusHex: String, navigationDarkMode: Boolean,  statusDarkMode: Boolean) {
    runOnUiThread {
      windowInsetsControllerCompat.isAppearanceLightNavigationBars = !navigationDarkMode
      windowInsetsControllerCompat.isAppearanceLightStatusBars = !statusDarkMode
      window.navigationBarColor = navigationHex.hexToColour()
      window.statusBarColor = statusHex.hexToColour()

      val bitmap = createBitmap(24, 24)
      bitmap.eraseColor(navigationHex.hexToColour())
      val canvas = Canvas(bitmap)
      canvas.drawColor(navigationHex.hexToColour())
      val bitmapDrawable = bitmap.toDrawable(resources)
      window.setBackgroundDrawable(bitmapDrawable)
    }
  }
}
