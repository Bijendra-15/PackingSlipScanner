package com.packingslipscanner.app

import android.os.Bundle
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

abstract class BaseWebViewActivity : AppCompatActivity() {

    protected lateinit var.webView: WebView

    protected fun configureWebView(webView: WebView, targetUrl: String) {
        this.webView = WebView

        webview.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheEnabled = true
            setAppCacheEnabled(true)
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_TYPE
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
            allowUniversalAccessFromFileURLs = true
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            userAgentString = "${userAgentString} PackingSlipScannerApp/1.0"
        }

        webview.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                return if (url.startsWith(targetUrl)) {
                    false
                } else {
                    view.stopLoading()
                    true
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        this::webView.takeIf { it != null }?.let { w ->
            w.stopLoading()
            w.clearCache()
            w.clearHistory()
            w.destroy()
        }
    }
}