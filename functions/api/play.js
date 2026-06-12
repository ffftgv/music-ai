/**
 * 获取歌曲播放链接 API - 使用 QingMusic 代理
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
    // 使用 QingMusic 的代理服务器构造播放链接
    let playUrl = null;
    
    if (source === 'kw') {
      // 酷我音乐：直接使用代理服务器
      playUrl = `https://music.haitangw.cc/music/gedan/kw.php?id=${id}&type=song&level=exhigh&format=mp3`;
    } else if (source === 'kg') {
      // 酷狗音乐
      playUrl = `https://music.haitangw.cc/music/gedan/kg.php?id=${id}&type=song&level=exhigh&format=mp3`;
    } else if (source === 'qq') {
      // QQ音乐
      playUrl = `https://music.haitangw.cc/music/gedan/qq.php?id=${id}&type=song&level=exhigh&format=mp3`;
    } else if (source === 'wy') {
      // 网易云音乐
      playUrl = `https://music.haitangw.cc/music/gedan/wy.php?id=${id}&type=song&level=exhigh&format=mp3`;
    }
    
    if (playUrl) {
      // 验证链接是否可用
      try {
        const testResponse = await fetch(playUrl, { method: 'HEAD' });
        if (testResponse.ok || testResponse.status === 302) {
          return new Response(JSON.stringify({
            url: playUrl,
            br: qualityMap[quality] || 320000,
            size: 0,
            type: 'mp3',
            source: source,
            proxy: true
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=600'
            }
          });
        }
      } catch (e) {
        console.log('链接验证失败，但仍返回:', e.message);
      }
      
      // 即使验证失败也返回链接（有些服务器不支持 HEAD 请求）
      return new Response(JSON.stringify({
        url: playUrl,
        br: qualityMap[quality] || 320000,
        size: 0,
        type: 'mp3',
        source: source,
        proxy: true,
        note: '代理链接，请直接尝试播放'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=600'
        }
      });
    }
    
    return new Response(JSON.stringify({ error: '无法构造播放链接' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
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
  '128': 128000,
  '320': 320000,
  'flac': 1411000,
  'hires': 2822000
};
