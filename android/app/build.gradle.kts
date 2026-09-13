plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "io.freetubeapp.freetubeandroid"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "io.freetubeapp.freetubeandroid"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0-local"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }

    tasks.named("preBuild") {
        doFirst {
            val webBundle = file("src/main/assets/web.js")
            check(webBundle.exists()) {
                "Missing Android web bundle. Run pnpm run pack:android:core first."
            }

            val header = webBundle.inputStream().use { input ->
                input.readNBytes(4096).decodeToString()
            }
            check(!header.contains("eval-source-map")) {
                "Development web bundle detected. Run pnpm run pack:android:core instead."
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.documentfile:documentfile:1.0.1")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.2.0")
}
