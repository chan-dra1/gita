const { withAndroidManifest, withInfoPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo Config Plugin for Gita Widgets.
 * This plugin prepares the native project structures for Home Screen widgets.
 */
module.exports = function withGitaWidgets(config) {
  
  // 1. Android Configuration: Add Widget Provider to Manifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // 1a. Remove any legacy/incorrect receivers to avoid duplicates
    if (mainApplication.receiver) {
      mainApplication.receiver = mainApplication.receiver.filter(r => 
        r.$['android:name'] !== 'dev.gita.widgets.VerseWidget' && 
        r.$['android:name'] !== 'com.alphawolf.gita.widgets.VerseWidget'
      );
    } else {
      mainApplication.receiver = [];
    }

    // 1b. Add the correct receiver
    mainApplication.receiver.push({
      $: {
        'android:name': 'com.alphawolf.gita.widgets.VerseWidget',
        'android:label': 'Gita Daily Verse',
        'android:exported': 'false'
      },
      'intent-filter': [{
        action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }]
      }],
      'meta-data': [{
        $: {
          'android:name': 'android.appwidget.provider',
          'android:resource': '@xml/verse_widget_info'
        }
      }]
    });
    
    return config;
  });

  // 2. iOS Configuration: Setup Widget Target Support
  config = withInfoPlist(config, (config) => {
    // Add App Group for shared storage between app and widget
    if (!config.modResults.NSAppGroupsUsageDescription) {
      config.modResults.NSAppGroupsUsageDescription = "Used to share daily verses with the Home Screen widget.";
    }
    return config;
  });

  // 3. Android File System: Copy templates
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(projectRoot, 'android/app/src/main/res');
      
      // Copy Kotlin File to the correct package directory
      const kotlinDest = path.join(projectRoot, 'android/app/src/main/java/com/alphawolf/gita/widgets/VerseWidget.kt');
      const kotlinTemplate = path.join(projectRoot, 'targets/widgets/android/VerseWidget.kt');
      if (fs.existsSync(kotlinTemplate)) {
        fs.mkdirSync(path.dirname(kotlinDest), { recursive: true });
        fs.copyFileSync(kotlinTemplate, kotlinDest);
      }

      // Copy XML Resources
      const infoDest = path.join(resDir, 'xml/verse_widget_info.xml');
      const infoTemplate = path.join(projectRoot, 'targets/widgets/android/verse_widget_info.xml');
      if (fs.existsSync(infoTemplate)) {
        fs.mkdirSync(path.dirname(infoDest), { recursive: true });
        fs.copyFileSync(infoTemplate, infoDest);
      }

      const layoutDest = path.join(resDir, 'layout/verse_widget.xml');
      const layoutTemplate = path.join(projectRoot, 'targets/widgets/android/verse_widget.xml');
      if (fs.existsSync(layoutTemplate)) {
        fs.mkdirSync(path.dirname(layoutDest), { recursive: true });
        fs.copyFileSync(layoutTemplate, layoutDest);
      }

      return config;
    },
  ]);

  // iOS Widget Extension sources live under targets/widgets/ios/ — do not inject @main WidgetKit
  // files into the main app target (invalid for App Store). Add a Widget Extension target in Xcode/EAS.

  return config;
};
