# ProGuard rules for Packing Slip Scanner App
# Keep BuildConfig class
-keep public class com.packingslipscanner.app.BuildConfig { *; }

# Keep WebView related classes
-keepclassmembers class * {
    @android.webkit.WebViewClient <init>;
    @android.webkit.WebChromeClient <init>;
}

# Keep our activities
-keep public class com.packingslipscanner.app.MainActivity {
    public protected *;
}

# Keep Base classes
-keep public class com.packingslipscanner.app.BaseWebViewActivity {
    public protected *;
}