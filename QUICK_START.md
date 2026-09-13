# Student Budget — Android + Web source project

## VS Code (Windows)
1. Extract the ZIP into a new folder named student_budget_app. Open that folder in VS Code. pubspec.yaml must be directly inside it.
2. Install the Flutter VS Code extension and Flutter SDK if needed. Android Studio must have an Android SDK, JDK 17, and an Android virtual device configured.
3. Start the Android emulator in Android Studio Device Manager. Use an API 35 device for a straightforward setup; the app minimum is API 23.
4. Run flutter pub get in the VS Code terminal.
5. Select your running Android emulator in VS Code's device selector and press F5.

Shortcut: after the emulator is running, double-click START_WINDOWS.bat. If several devices are connected, select the Android emulator when prompted.

## FlutLab
This revision also includes ios/ support files because the importer requires that directory. Choose Web or Android. Native iOS building is not supported by this package; see ios/README.md.

Import the ZIP itself. This edition includes android/ and web/ at the ZIP root. Select a Flutter 3.29.x SDK if available, fetch packages, and build for Android or Web. Other Flutter SDK versions may need build-tool alignment; compatibility with every hosted SDK is not claimed.

## Build configuration
Android Gradle Plugin 8.7.3, Gradle 8.10.2, Kotlin 2.1.0, Java 17, compile/target SDK 35, min SDK 23. SDK paths in android/local.properties are machine-specific and intentionally absent. Launch using Flutter (flutter run or VS Code F5), which prepares local paths and missing Gradle wrapper files from its SDK cache. Wrapper executable/JAR files are not bundled; do not invoke Gradle directly before Flutter prepares them. If your hosted importer requires those exact binaries, export a blank project from its matching SDK and supply it for integration.

This is a source project, not an APK. First builds download dependencies and are slower; subsequent builds use cached dependencies. Internet and sufficient disk space are needed on first run. Do not expect an emulator itself inside the ZIP.

## Verification and scope
ZIP entries and Android XML/configuration were inspected locally. Flutter/Dart and an Android emulator are unavailable here; neither compilation nor a live FlutLab import has been verified. Run flutter doctor -v for local setup problems. Run flutter test test/budget_logic_test.dart to check the included calculation test.

The app retains the supplied demo behaviour: in-memory data resets on restart, login is not real authentication, reminders are not scheduled notifications. Do not use real passwords. Release configuration uses debug signing for demos and must be changed before store publication.

If it fails, send the first full error message and your Flutter version, rather than only the final 'build failed' line.
