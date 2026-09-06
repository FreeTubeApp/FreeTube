import groovy.json.JsonSlurper


class VersionInfo {
  val appId: String
  val version: String
  val versionCode: Int
  constructor(givenId: String, givenVersion: String, givenCode: Int) {
    appId = givenId
    version = givenVersion
    versionCode = givenCode
  }
}

fun getVersionInfo(project: Project): VersionInfo {
  val json = JsonSlurper()
  val packageJsonPath = project.file("../../package.json")

  val packageJson = json.parse(packageJsonPath) as Map<String, Any>
  val versionName = packageJson["version"] as String
  val appName = "io.freetubeapp." + packageJson["name"]
  val parts = versionName.split("-")
  val numbers = parts[0].split(".")
  val major = numbers[0].toInt()
  val minor = numbers[1].toInt()
  val patch = numbers[2].toInt()
  var build = 0
  if (parts.size > 2) {
    println(parts)
    build = parts[2].toInt()
  } else if (numbers.size > 3) {
    build = numbers[3].toInt()
  }

  val versionCode = major * 10000000 + minor * 10000000 + patch * 1000 + build

  return VersionInfo(appName, versionName, versionCode)
}

val versionInfo = getVersionInfo(project)

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    signingConfigs {
      getByName("debug") {
        // inject signing config
      };
    }
    namespace = "io.freetubeapp.freetube"
    compileSdk = 34
    dataBinding {
        enable = true
    }
    defaultConfig {
        applicationId = versionInfo.appId
        minSdk = 29
        targetSdk = 34
        versionCode = versionInfo.versionCode
        versionName = versionInfo.version

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // in this case debug is just a name of a signing config
            // the release workflow injects the release keystore info into the "debug" signing config
            // i tried to add a signing config called "release", but i got build errors :(
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {

    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.media3:media3-ui:1.2.1")

}
