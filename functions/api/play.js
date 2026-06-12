/**
 * 获取播放链接 API - 修复版
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const id = url.searchParams.get('id');
  const source = url.searchParams.get('source') || 'kw';
  const quality = url.searchParams.get('quality') || '320';
  
  if (!id) {
    return new Response(JSON.stringify({ error: '缺少歌曲ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let result = null;
    
    console.log('播放请求:', { id, source, quality });
    
    switch (source) {
      case 'kw':
        result = await getKuwoPlayUrl(id, quality);
        break;
      case 'kg':
        result = await getKugouPlayUrl(id, quality);
        break;
      case 'qq':
        result = await getQQPlayUrl(id, quality);
        break;
      case 'wy':
        result = await getNeteasePlayUrl(id, quality);
        break;
      default:
        throw new Error('不支持的音源');
    }
    
    if (!result || !result.url) {
      throw new Error('无法获取播放链接');
    }
    
    console.log('返回播放链接:', result.url);
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=600'
      }
    });
    
  } catch (error) {
    console.error('获取播放链接失败:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      id: id,
      source: source
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 酷我音乐获取播放链接
async function getKuwoPlayUrl(rid, quality) {
  // 音质映射
  const brMap = {
    '128': '128k',
    '320': '320k',
    'flac': 'flac',
    'hires': 'hires'
  };
  
  const br = brMap[quality] || '320k';
  
  // 正确的 API URL（使用 & 而不是转义字符）
  const apiUrl = 'https://antiserver.kuwo.cn/anti.s?format=mp3&response=url&type=convert_url&rid=' + rid + '&br=' + br;
  
  console.log('酷我API请求:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'KWMobile/6.0',
        'Referer': 'https://www.kuwo.cn/'
      }
    });
    
    if (!response.ok) {
      throw new Error('API返回' + response.status);
    }
    
    const playUrl = await response.text();
    
    console.log('酷我返回URL:', playUrl);
    
    // 检查返回的URL是否有效
    if (playUrl && playUrl.trim().startsWith('http')) {
      return {
        url: playUrl.trim(),
        br: br,
        size: 0,
        type: 'mp3',
        source: 'kw'
      };
    }
    
    throw new Error('未获取到有效的播放链接');
    
  } catch (error) {
    console.error('酷我音乐播放链接获取失败:', error);
    throw error;
  }
}

// 酷狗音乐获取播放链接
async function getKugouPlayUrl(hash, quality) {
  const apiUrl = 'https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=' + hash;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Kugou/Android 12.3.1',
        'Referer': 'https://www.kugou.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error('API返回' + response.status);
    }
    
    const data = await response.json();
    
    if (data.url) {
      return {
        url: data.url,
        br: data.bitRate,
        size: data.fileSize,
        type: data.extName,
        source: 'kg'
      };
    }
    
    throw new Error('未获取到播放链接');
    
  } catch (error) {
    console.error('酷狗音乐播放链接获取失败:', error);
    throw error;
  }
}

// QQ音乐获取播放链接（暂未实现）
async function getQQPlayUrl(mid, quality) {
  throw new Error('QQ音乐播放链接获取暂未实现');
}

// 网易云音乐获取播放链接（暂未实现）
async function getNeteasePlayUrl(id, quality) {
  throw new Error('网易云音乐播放链接获取暂未实现');
}
