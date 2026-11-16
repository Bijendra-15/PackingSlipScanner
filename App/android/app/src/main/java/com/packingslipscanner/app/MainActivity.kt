package com.packingslipscanner.app

import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ConstraintLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var WebView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: ConstraintLayout
    private lateinit var errorMessage: TextView
    private lateinit var retryButton: Button

    private val targetUrl = BuildConfig.WEB_APP_URL
    private var retryCount = 0
    private val maxRetries = 3

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initializeViews()
        setupWebView()
        setupRetryButton()
        loadUrl(targetUrl)
    }

    private fun initializeViews() {
        webview = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)
        errorMessage = findViewById(R.id.errorMessage)
        retryButton = findViewById(R.id.retryButton)
    }

    private fun setupWebView() {
        webview.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            javaScriptCanOpenWindowsAutomatically = true
            supportMultipleWindows = true
            layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_TYPE
            setGeolocationEnabled(true)
            setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
        }

        webview.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        webview.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                if (url.startsWith(targetUrl)) {
                    return false
                }
                view.stopLoading()
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                hideError()
            }

            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                showProgress()
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    showError("Failed to load page. Error code: ${error.errorCode}")
                }
            }
        }

        webview.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    hideProgress()
                }
            }
        }
    }

    private fun setupRetryButton() {
        retryButton.setOnClickListener {
            retryCount = 0
            loadUrl(targetUrl)
        }
    }

    private fun loadUrl(url: String) {
        hideError()
        showProgress()
        webview.loadUrl(url)
    }

    private fun showProgress() {
        progressBar.visibility = View.VISIBLE
    }

    private fun hideProgress() {
        progressBar.visibility = View.GONE
    }

    private fun showError(message: String) {
        hideProgress()
        errorMessage.text = message
        errorLayout.visibility = View.VISIBLE
        webview.visibility = View.GONE

        if (retryCount < maxRetries) {
            retryCount++
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                if (!isFinishing) {
                    loadUrl(targetUrl)
                }
            }, (2000 * retryCount).toLong())
        } else {
            Toast.makeText(this, "Max retries reached. Tap Retry to try again.", Toast.LENGTH_LONG).show()
        }
    }

    private fun hideError() {
        errorLayout.visibility = View.GONE
        webview.visibility = View.VISIBLE
        retryCount = 0
    }

    override fun onBackPressed() {
        if (webview.canGoBack()) {
            webview.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        webview?.let {
            it.stopLoading()
            it.clearCache()
            it.clearHistory()
            it.destroy()
        }
        super.onDestroy()
    }
}