/**
 * 搜索音乐 API - 使用QQ音乐API（返回标准JSON）
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const keyword = url.searchParams.get('keyword');
  const source = url.searchParams.get('source') || 'qq'; // 默认使用QQ音乐
  
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少搜索关键词' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let results = [];
    
    switch (source) {
      case 'qq':
        results = await searchQQ(keyword);
        break;
      case 'kg':
        results = await searchKugou(keyword);
        break;
      case 'wy':
        results = await searchNetease(keyword);
        break;
      case 'kw':
        results = await searchKuwo(keyword);
        break;
      default:
        return new Response(JSON.stringify({ error: '不支持的音源' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=300'
      }
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// QQ音乐搜索 - 返回标准JSON
async function searchQQ(keyword) {
  const apiUrl = `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?_datacache=1&key=${encodeURIComponent(keyword)}&page=1`;
  
  console.log('QQ音乐搜索:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://y.qq.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`QQ音乐API返回${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('QQ音乐返回:', JSON.stringify(data).substring(0, 200));
    
    if (data.data && data.data.song && data.data.song.itemlist && data.data.song.itemlist.length > 0) {
      return data.data.song.itemlist.slice(0, 20).map((song, idx) => ({
        id: song.mid || song.id,
        name: song.name || '未知歌曲',
        artist: song.singer || '未知歌手',
        album: song.album || '未知专辑',
        duration: 0,
        picUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.mid}.jpg` || `https://picsum.photos/300/300?random=${idx}`,
        source: 'qq'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('QQ音乐搜索失败:', error);
    throw error;
  }
}

// 酷狗音乐搜索
async function searchKugou(keyword) {
  const apiUrl = `https://msearch.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=20`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Kugou/Android 12.3.1',
        'Referer': 'https://www.kugou.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`酷狗API返回${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.info && data.data.info.length > 0) {
      return data.data.info.slice(0, 20).map(song => ({
        id: song.hash,
        name: song.songname,
        artist: song.singername,
        album: song.album_name || '未知专辑',
        duration: (song.duration || 180) * 1000,
        picUrl: song.img || `https://picsum.photos/300/300?random=${Math.random()}`,
        source: 'kg'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('酷狗搜索失败:', error);
    throw error;
  }
}

// 网易云音乐搜索
async function searchNetease(keyword) {
  const apiUrl = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=20&offset=0`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://music.163.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`网易云API返回${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 200 && data.result && data.result.songs && data.result.songs.length > 0) {
      return data.result.songs.slice(0, 20).map(song => ({
        id: song.id,
        name: song.name,
        artist: song.artists.map(a => a.name).join(', '),
        album: song.album.name || '未知专辑',
        duration: song.duration,
        picUrl: song.album.picUrl || `https://picsum.photos/300/300?random=${song.id}`,
        source: 'wy'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('网易云搜索失败:', error);
    throw error;
  }
}

// 酷我音乐搜索 - 使用备用方案
async function searchKuwo(keyword) {
  // 酷我API返回非标准格式，暂时返回空结果
  console.log('酷我音乐API格式不兼容，跳过');
  return [];
}
