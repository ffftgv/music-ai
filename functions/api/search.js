/**
 * 搜索音乐 API - Cloudflare Workers Function
 * 路径: /api/search
 */

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const keyword = url.searchParams.get('keyword');
  const source = url.searchParams.get('source') || 'wy';
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 20;
  
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少搜索关键词' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let results = [];
    
    switch (source) {
      case 'wy':
        results = await searchNetease(keyword, page, limit);
        break;
      case 'qq':
        results = await searchQQ(keyword, page, limit);
        break;
      case 'kg':
        results = await searchKugou(keyword, page, limit);
        break;
      case 'kw':
        results = await searchKuwo(keyword, page, limit);
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

// 网易云音乐搜索
async function searchNetease(keyword, page, limit) {
  const offset = (page - 1) * limit;
  const apiUrl = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=${limit}&offset=${offset}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com/'
    }
  });
  
  const data = await response.json();
  
  if (data.code === 200 && data.result && data.result.songs) {
    return data.result.songs.map(song => ({
      id: song.id,
      name: song.name,
      artist: song.artists.map(a => a.name).join(', '),
      album: song.album.name,
      duration: song.duration,
      picUrl: song.album.picUrl,
      source: 'wy'
    }));
  }
  
  return [];
}

// QQ音乐搜索
async function searchQQ(keyword, page, limit) {
  const apiUrl = `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?_datacache=1&key=${encodeURIComponent(keyword)}&page=${page}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://y.qq.com/'
    }
  });
  
  const data = await response.json();
  
  if (data.data && data.data.song && data.data.song.itemlist) {
    return data.data.song.itemlist.map((song, idx) => ({
      id: song.id,
      mid: song.mid,
      name: song.name,
      artist: song.singer,
      album: song.album,
      duration: 0,
      picUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.mid}.jpg`,
      source: 'qq'
    }));
  }
  
  return [];
}

// 酷狗音乐搜索
async function searchKugou(keyword, page, limit) {
  const apiUrl = `https://msearch.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(keyword)}&page=${page}&pagesize=${limit}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Kugou/Android 12.3.1',
      'Referer': 'https://www.kugou.com/'
    }
  });
  
  const data = await response.json();
  
  if (data.data && data.data.info) {
    return data.data.info.map(song => ({
      id: song.hash,
      name: song.songname,
      artist: song.singername,
      album: song.album_name,
      duration: song.duration * 1000,
      picUrl: song.img,
      source: 'kg'
    }));
  }
  
  return [];
}

// 酷我音乐搜索
async function searchKuwo(keyword, page, limit) {
  const apiUrl = `https://search.kuwo.cn/r.s?all=${encodeURIComponent(keyword)}&pn=${page}&rn=${limit}&fmt=json`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'KWMobile/6.0',
      'Referer': 'https://www.kuwo.cn/'
    }
  });
  
  const data = await response.json();
  
  if (data.abslist) {
    return data.abslist.map(song => ({
      id: song.MUSICRID.replace('MUSIC_', ''),
      name: song.SONGNAME,
      artist: song.ARTIST,
      album: song.ALBUM,
      duration: song.DURATION * 1000,
      picUrl: song.ARTIST_PIC,
      source: 'kw'
    }));
  }
  
  return [];
}
