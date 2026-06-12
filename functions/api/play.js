/**
 * 获取播放链接 API - 使用音乐平台公开 API
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
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=600'
      }
    });
    
  } catch (error) {
    console.error('获取播放链接失败:', error);
    
    // 失败时返回测试音频
    return new Response(JSON.stringify({
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      br: 320000,
      size: 0,
      type: 'mp3',
      source: source,
      note: '测试音频（获取失败：' + error.message + '）'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 酷我音乐获取播放链接 - 使用公开 API
async function getKuwoPlayUrl(rid, quality) {
  // 音质映射
  const brMap = {
    '128': '128k',
    '320': '320k',
    'flac': 'flac',
    'hires': 'hires'
  };
  
  const br = brMap[quality] || '320k';
  
  // 使用酷我音乐的公开 API
  const apiUrl = `https://antiserver.kuwo.cn/anti.s?format=mp3&response=url&type=convert_url&rid=${rid}&br=${br}`;
  
  console.log('酷我播放链接API:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'KWMobile/6.0',
        'Referer': 'https://www.kuwo.cn/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API返回${response.status}`);
    }
    
    const playUrl = await response.text();
    
    console.log('酷我播放链接:', playUrl);
    
    // 返回的应该是直接的 MP3 URL
    if (playUrl && playUrl.startsWith('http')) {
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
  const apiUrl = `https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Kugou/Android 12.3.1',
        'Referer': 'https://www.kugou.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API返回${response.status}`);
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

// QQ音乐获取播放链接
async function getQQPlayUrl(mid, quality) {
  // QQ音乐的API比较复杂，需要vkey等参数
  // 这里使用一个简化版，直接返回测试音频
  // 实际应用中需要调用QQ音乐的API
  
  console.log('QQ音乐播放链接获取暂未实现，使用测试音频');
  
  throw new Error('QQ音乐播放链接获取暂未实现');
}

// 网易云音乐获取播放链接
async function getNeteasePlayUrl(id, quality) {
  // 网易云音乐的API需要加密参数
  // 这里使用一个简化版，直接返回测试音频
  // 实际应用中需要调用网易云的API
  
  console.log('网易云音乐播放链接获取暂未实现，使用测试音频');
  
  throw new Error('网易云音乐播放链接获取暂未实现');
}
