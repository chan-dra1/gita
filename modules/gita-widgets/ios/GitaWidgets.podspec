Pod::Spec.new do |s|
  s.name           = 'GitaWidgets'
  s.version        = '1.0.0'
  s.summary        = 'Widget data bridge for Daily Bhagavad Gita'
  s.description    = 'Writes verse payload to App Group and reloads WidgetKit timelines.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
  s.frameworks = 'WidgetKit'
end
