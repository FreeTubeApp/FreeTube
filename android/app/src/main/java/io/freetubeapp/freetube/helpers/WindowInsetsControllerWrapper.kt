package io.freetubeapp.freetube.helpers

import android.os.Build
import android.view.WindowInsetsController
import androidx.core.view.WindowInsetsControllerCompat

class WindowInsetsControllerWrapper {
  private var regular: WindowInsetsController? = null
  private var compat: WindowInsetsControllerCompat? = null

  var systemBarsBehavior: Int
    get() {
      val behavior = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        regular?.systemBarsBehavior
      } else {
        compat?.systemBarsBehavior
      }
      return behavior ?: 1
    }
    set(value) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        regular?.systemBarsBehavior = value
      }
      compat?.systemBarsBehavior = value
    }

  constructor(insetsController: WindowInsetsController?) {
    regular = insetsController
  }

  constructor(insetsController: WindowInsetsControllerCompat) {
    compat = insetsController
  }

  fun hide(flag: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      regular?.hide(flag)
    }
    compat?.hide(flag)
  }

  fun show(flag: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      regular?.show(flag)
    }
    compat?.show(flag)
  }
}
