/**
 * 搜索音乐 API - 使用 QingMusic 代理
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const keyword = url.searchParams.get('keyword');
  const source = url.searchParams.get('source') || 'kw';
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 20;
  
  if (!keyword) {
    return new Response(JSON.stringify({ error: '缺少搜索关键词' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // 使用 QingMusic 的代理服务器
    const apiUrl = `https://music.haitangw.cc/music/gedan/${source}.php?name=${encodeURIComponent(keyword)}&page=${page}`;
    
    console.log('搜索请求:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.haitangw.cc/'
      }
    });
    
    const data = await response.json();
    console.log('搜索响应:', JSON.stringify(data).substring(0, 200));
    
    if (data.code === 200 && data.data && data.data.musicList) {
      const results = data.data.musicList.slice(0, limit).map((song, index) => ({
        id: song.rid || `song_${index}`,
        name: song.name || '未知歌曲',
        artist: song.artist || song.singername || '未知歌手',
        album: song.album || song.albumname || '未知专辑',
        duration: (song.duration || 180) * 1000,
        picUrl: song.pic || song.img || `https://picsum.photos/300/300?random=${index}`,
        source: source,
        playUrl: song.url ? `https://music.haitangw.cc/music/gedan/${source}.php?${song.url}` : null
      }));
      
      return new Response(JSON.stringify(results), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=300'
        }
      });
    }
    
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
