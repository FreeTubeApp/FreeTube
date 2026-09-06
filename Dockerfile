FROM node:24-bookworm-slim

ARG ANDROID_CMDLINE_TOOLS=13114758

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    PNPM_HOME=/pnpm \
    PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/pnpm:$PATH

RUN apt-get update \
    && apt-get install --no-install-recommends --yes \
       ca-certificates \
       curl \
       openjdk-17-jdk-headless \
       unzip \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p "$ANDROID_HOME/cmdline-tools" /pnpm/store \
    && curl --fail --silent --show-error --location \
       "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS}_latest.zip" \
       --output /tmp/android-commandline-tools.zip \
    && unzip -q /tmp/android-commandline-tools.zip -d "$ANDROID_HOME/cmdline-tools" \
    && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest" \
    && rm /tmp/android-commandline-tools.zip \
    && bash -o pipefail -c 'yes | sdkmanager --licenses >/dev/null; status=$?; test "$status" -eq 0 -o "$status" -eq 141' \
    && sdkmanager "platforms;android-34" "build-tools;34.0.0" \
    && npm install --global pnpm@10 \
    && pnpm config set store-dir /pnpm/store \
    && rm -rf /root/.npm

WORKDIR /workspace

CMD ["bash"]
