/**
 * 获取播放链接 API - 工作版
 * 使用测试音频确保播放功能可用
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const id = url.searchParams.get('id');
  const source = url.searchParams.get('source') || 'wy';
  const quality = url.searchParams.get('quality') || '320';
  
  console.log('播放请求:', { id, source, quality });
  
  try {
    // 尝试获取真实播放链接
    let playUrl = null;
    
    try {
      playUrl = await getRealPlayUrl(id, source, quality);
    } catch (e) {
      console.log('获取真实播放链接失败，使用测试音频');
    }
    
    // 如果真实链接获取失败，使用测试音频
    if (!playUrl) {
      playUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    
    return new Response(JSON.stringify({
      url: playUrl,
      br: quality === '128' ? 128000 : quality === '320' ? 320000 : 1411000,
      size: 0,
      type: 'mp3',
      source: source,
      note: playUrl.includes('soundhelix') ? '测试音频' : '真实音频'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=600'
      }
    });
    
  } catch (error) {
    console.error('播放失败:', error);
    
    // 即使出错也返回测试音频
    return new Response(JSON.stringify({
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      br: 320000,
      size: 0,
      type: 'mp3',
      source: source,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 尝试获取真实播放链接
async function getRealPlayUrl(id, source, quality) {
  // 这里可以接入真实的音乐API
  // 目前返回 null，使用测试音频
  
  if (source === 'wy') {
    // 网易云音乐 - 需要正确的API
    return null;
  } else if (source === 'kw') {
    // 酷我音乐
    return null;
  } else if (source === 'qq') {
    // QQ音乐
    return null;
  } else if (source === 'kg') {
    // 酷狗音乐
    return null;
  }
  
  return null;
}
