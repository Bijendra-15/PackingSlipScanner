# ProGuard rules for Packing Slip Scanner App
-keep public class com.packingslipscanner.app.BuildConfig { *; }
-keepclassmembers class * {
    @android.webkit.WebViewClient <init>;
    @android.webkit.WebChromeClient <init>;
}
-keep public class com.packingslipscanner.app.MainActivity {
    public protected *;
}