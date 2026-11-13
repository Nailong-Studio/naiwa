package ink.zhihui.naiwa;
import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
 private WebView web;
 private boolean foreground;
 private static final String HOST="appassets.androidplatform.net";
 private void immersive(){getWindow().getDecorView().setSystemUiVisibility(5894);}
 @Override public void onCreate(Bundle state){
  super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  immersive();web=new WebView(this);setContentView(web);
  web.setOverScrollMode(View.OVER_SCROLL_NEVER);web.setHorizontalScrollBarEnabled(false);web.setVerticalScrollBarEnabled(false);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(true);s.setSupportZoom(false);
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){
    Uri u=req.getUrl();if(HOST.equals(u.getHost())&&"https".equals(u.getScheme()))return false;
    if(req.isForMainFrame()&&("https".equals(u.getScheme())||"http".equals(u.getScheme())))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException ignored){}
    return true;
   }
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){
    Uri u=req.getUrl();if(!HOST.equals(u.getHost())||!"https".equals(u.getScheme()))return response("text/plain",403,"Forbidden",new ByteArrayInputStream(new byte[0]));
    String p=u.getPath();if(p==null||p.contains(".."))return response("text/plain",403,"Forbidden",new ByteArrayInputStream(new byte[0]));
    if(p.equals("/"))p="/index.html";
    String ext=p.substring(p.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);
    String mime=MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
    if(ext.equals("js")||ext.equals("mjs"))mime="text/javascript";
    if(ext.equals("json"))mime="application/json";
    if(mime==null)mime="application/octet-stream";
    try{return response(mime,200,"OK",getAssets().open("game"+p));}
    catch(IOException e){return response("text/plain",404,"Not Found",new ByteArrayInputStream(new byte[0]));}
   }
  });web.loadUrl("https://"+HOST+"/index.html");
 }
 private WebResourceResponse response(String mime,int status,String reason,InputStream in){
  Map<String,String> h=new HashMap<>();h.put("Cache-Control","no-cache");h.put("X-Content-Type-Options","nosniff");
  return new WebResourceResponse(mime,(mime.startsWith("text/")||mime.equals("application/json"))?"UTF-8":null,status,reason,h,in);
 }
 private static final String SAVE="window.naiwaSaveAndPause ? window.naiwaSaveAndPause() : true";
 @Override protected void onPause(){foreground=false;if(web!=null){web.evaluateJavascript(SAVE,ignored->{if(web!=null&&!foreground)web.pauseTimers();});web.onPause();}super.onPause();}
 @Override protected void onResume(){super.onResume();foreground=true;if(web!=null){web.resumeTimers();web.onResume();}immersive();}
 @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)immersive();}
 @Override public void onBackPressed(){
  web.evaluateJavascript(SAVE,result->{
   if(isFinishing()||isDestroyed())return;
   boolean saved="true".equals(result);
   AlertDialog.Builder dialog=new AlertDialog.Builder(this).setTitle(saved?"退出游戏？":"进度未能保存")
    .setMessage(saved?"当前进度已保留，下次打开可选择继续游戏。":"请检查设备存储空间，暂时不要退出。")
    .setNegativeButton("返回游戏",(d,w)->immersive());
   if(saved)dialog.setPositiveButton("退出",(d,w)->finish());
   dialog.show();
  });
 }
 @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
