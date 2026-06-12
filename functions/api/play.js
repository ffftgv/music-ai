/**
 * 获取歌曲播放链接 API - Cloudflare Workers Function
 * 路径: /api/play
 */

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const id = url.searchParams.get('id');
  const source = url.searchParams.get('source') || 'wy';
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
      case 'wy':
        result = await getNeteasePlayUrl(id, quality);
        break;
      case 'qq':
        result = await getQQPlayUrl(id, quality);
        break;
      case 'kg':
        result = await getKugouPlayUrl(id, quality);
        break;
      case 'kw':
        result = await getKuwoPlayUrl(id, quality);
        break;
      default:
        return new Response(JSON.stringify({ error: '不支持的音源' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (!result || !result.url) {
      return new Response(JSON.stringify({ error: '无法获取播放链接' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 音质映射
const qualityMap = {
  '128': { wy: '128000', qq: '128', kg: '128', kw: '128k' },
  '320': { wy: '320000', qq: '320', kg: '320', kw: '320k' },
  'flac': { wy: 'flac', qq: 'flac', kg: 'flac', kw: 'flac' },
  'hires': { wy: 'hires', qq: 'atmos', kg: 'hires', kw: 'hires' }
};

// 网易云获取播放链接
async function getNeteasePlayUrl(id, quality) {
  const br = qualityMap[quality]?.wy || '320000';
  const apiUrl = `https://music.163.com/api/song/enhance/player/url/v1?id=${id}&level=${quality}&encodeType=flac`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  });
  
  const data = await response.json();
  
  if (data.code === 200 && data.data && data.data[0]) {
    const song = data.data[0];
    return {
      url: song.url,
      br: song.br,
      size: song.size,
      type: song.type,
      md5: song.md5
    };
  }
  
  return null;
}

// QQ音乐获取播放链接
async function getQQPlayUrl(id, quality) {
  const apiUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg`;
  
  const payload = {
    req_1: {
      method: "GetCdnDispatch",
      module: "vkey.GetCdnDispatch",
      param: {
        guid: "1234567890",
        songmid: [id],
        songtype: [0],
        uin: "0",
        loginflag: 0,
        platform: "20"
      }
    }
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://y.qq.com/',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  if (data.req_1 && data.req_1.data) {
    const vkey = data.req_1.data.vkey;
    if (vkey) {
      const url = `https://ws.stream.qqmusic.qq.com/${id}.m4a?vkey=${vkey}&guid=1234567890&fromtag=66`;
      return {
        url: url,
        br: qualityMap[quality]?.qq || '320',
        type: 'm4a'
      };
    }
  }
  
  return null;
}

// 酷狗获取播放链接
async function getKugouPlayUrl(hash, quality) {
  const apiUrl = `https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Kugou/Android 12.3.1',
      'Referer': 'https://www.kugou.com/'
    }
  });
  
  const data = await response.json();
  
  if (data.url) {
    return {
      url: data.url,
      br: data.bitRate,
      size: data.fileSize,
      type: data.extName
    };
  }
  
  return null;
}

// 酷我获取播放链接
async function getKuwoPlayUrl(rid, quality) {
  const br = qualityMap[quality]?.kw || '320k';
  const apiUrl = `https://antiserver.kuwo.cn/anti.s?format=mp3&response=url&type=convert_url&rid=${rid}&br=${br}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'KWMobile/6.0',
      'Referer': 'https://www.kuwo.cn/'
    }
  });
  
  const url = await response.text();
  
  if (url && url.startsWith('http')) {
    return {
      url: url,
      br: br,
      type: 'mp3'
    };
  }
  
  return null;
}
