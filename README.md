# Student Budget App — emulator edition

Updated for the observed FlutLab ios/ import requirement. Includes an iOS support directory for Android/Web import, not a complete Xcode build target. Select Web or Android. Live import has not been verified; see ios/README.md for the precise scope.

Read QUICK_START.md for VS Code and FlutLab instructions.

This package includes Android source/build configuration and the existing Web target. Open the extracted folder containing pubspec.yaml, start your Android emulator, run flutter pub get, select the emulator in VS Code and press F5. START_WINDOWS.bat offers a Windows shortcut.

Flutter prepares local SDK paths and missing wrapper files on first run. The first build needs network downloads. This package is not a prebuilt APK and has not been compiled or tested in an emulator here.

Demo login and in-memory storage are unchanged. Full limitations and build versions are documented in QUICK_START.md.
