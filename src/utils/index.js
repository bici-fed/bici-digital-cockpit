/* 加密，sourceStr必须是字符串 */
export function getEncryption(sourceStr) {
  return window.btoa(window.encodeURIComponent(sourceStr));
}

/* 解密，getEncryption的反向 */
export function getDecryption(target) {
  return window.decodeURIComponent(window.atob(target));
}

// 启动全屏
export function launchFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullScreen();
  }
}

export function exitFullscreen() {
  if (document.exitFullscreen) {
    // W3C
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    // FIREFOX
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    // CHROME
    document.webkitCancelFullScreen();
  } else if (document.msExitFullscreen) {
    // MSIE
    document.msExitFullscreen();
  } else if (document.oRequestFullscreen) {
    document.oCancelFullScreen();
  }
}

export function addFullScreenChanegListener(callback) {
  document.addEventListener('fullscreenchange', function() {
    callback && callback();
  });
  document.addEventListener('mozfullscreenchange', function() {
    callback && callback();
  });
  document.addEventListener('webkitfullscreenchange', function() {
    callback && callback();
  });
  document.addEventListener('msfullscreenchange', function() {
    callback && callback();
  });
}

export function getFullScreenState() {
  return !!(
    window.fullscreen ||
    document.mozFullScreen ||
    document.webkitIsFullScreen ||
    document.webkitFullScreen ||
    document.msFullScreen
  );
}
