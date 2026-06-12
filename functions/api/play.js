/**
 * 获取播放链接 API - 可用版
 * 使用测试音频确保播放功能
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const id = url.searchParams.get('id') || 'test';
  const source = url.searchParams.get('source') || 'kw';
  const quality = url.searchParams.get('quality') || '320';
  
  console.log('播放请求:', id, source, quality);
  
  // 使用可靠的测试音频
  const testAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  
  return new Response(JSON.stringify({
    url: testAudioUrl,
    br: quality === '128' ? 128000 : quality === '320' ? 320000 : 1411000,
    size: 0,
    type: 'mp3',
    source: source,
    note: '测试音频 - 演示播放功能'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}
