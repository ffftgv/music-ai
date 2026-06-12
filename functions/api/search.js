/**
 * 搜索音乐 API - 调试版
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const keyword = url.searchParams.get('keyword');
  const source = url.searchParams.get('source') || 'kw';
  
  console.log('搜索请求 - keyword:', keyword, 'source:', source);
  
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少搜索关键词' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let results = [];
    
    switch (source) {
      case 'kw':
        results = await searchKuwo(keyword);
        break;
      case 'kg':
        results = await searchKugou(keyword);
        break;
      case 'qq':
        results = await searchQQ(keyword);
        break;
      case 'wy':
        results = await searchNetease(keyword);
        break;
    }
    
    console.log('搜索结果数量:', results.length);
    console.log('第一个结果:', results[0]);
    
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function searchKuwo(keyword) {
  const apiUrl = `https://search.kuwo.cn/r.s?all=${encodeURIComponent(keyword)}&pn=1&rn=20&fmt=json`;
  
  console.log('酷我API请求:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'KWMobile/6.0',
        'Referer': 'https://www.kuwo.cn/'
      }
    });
    
    console.log('酷我API响应状态:', response.status);
    
    const data = await response.json();
    
    console.log('酷我API返回数据:', JSON.stringify(data).substring(0, 200));
    
    if (data.abslist && data.abslist.length > 0) {
      return data.abslist.slice(0, 20).map(song => ({
        id: song.MUSICRID ? song.MUSICRID.replace('MUSIC_', '') : `kw_${Math.random()}`,
        name: song.SONGNAME || '未知歌曲',
        artist: song.ARTIST || '未知歌手',
        album: song.ALBUM || '未知专辑',
        duration: (song.DURATION || 180) * 1000,
        picUrl: song.ARTIST_PIC || `https://picsum.photos/300/300?random=${Math.random()}`,
        source: 'kw'
      }));
    }
    
    console.log('酷我API未返回有效数据');
    return [];
  } catch (error) {
    console.error('酷我搜索失败:', error);
    return [];
  }
}

async function searchKugou(keyword) {
  const apiUrl = `https://msearch.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=20`;
  
  console.log('酷狗API请求:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Kugou/Android 12.3.1',
        'Referer': 'https://www.kugou.com/'
      }
    });
    
    const data = await response.json();
    
    console.log('酷狗API返回:', JSON.stringify(data).substring(0, 200));
    
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
    return [];
  }
}

async function searchQQ(keyword) {
  const apiUrl = `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?_datacache=1&key=${encodeURIComponent(keyword)}&page=1`;
  
  console.log('QQ音乐API请求:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://y.qq.com/'
      }
    });
    
    const data = await response.json();
    
    console.log('QQ音乐API返回:', JSON.stringify(data).substring(0, 200));
    
    if (data.data && data.data.song && data.data.song.itemlist && data.data.song.itemlist.length > 0) {
      return data.data.song.itemlist.slice(0, 20).map((song, idx) => ({
        id: song.mid || song.id,
        name: song.name,
        artist: song.singer,
        album: song.album || '未知专辑',
        duration: 0,
        picUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.mid}.jpg` || `https://picsum.photos/300/300?random=${idx}`,
        source: 'qq'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('QQ音乐搜索失败:', error);
    return [];
  }
}

async function searchNetease(keyword) {
  const apiUrl = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=20&offset=0`;
  
  console.log('网易云API请求:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://music.163.com/'
      }
    });
    
    const data = await response.json();
    
    console.log('网易云API返回:', JSON.stringify(data).substring(0, 200));
    
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
    return [];
  }
}
