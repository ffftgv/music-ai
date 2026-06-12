/**
 * 青听音乐播放器 - 酷狗概念版API完整实现
 * 基于抓包分析，使用正确的接口和参数
 */
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        
        // 酷狗概念版配置
        this.config = {
            appid: '3114',
            ver: '2.0.0',
            oid: '0',
            pid: '0',
            cid: '0',
            eid: '0',
            mid: '0',
            uid: '0',
            net: 'WIFI',
            s: 'b3a52a7a958bf0aed0ebfba2e9a818b7', // 示例hash
            t: Math.floor(Date.now() / 1000)
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadPlaylist();
    }
    
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            sourceSelect: document.getElementById('sourceSelect'),
            resultsList: document.getElementById('resultsList'),
            resultCount: document.getElementById('resultCount'),
            trackName: document.getElementById('trackName'),
            trackArtist: document.getElementById('trackArtist'),
            albumArt: document.getElementById('albumArt'),
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            qualitySelect: document.getElementById('qualitySelect'),
            progressBar: document.getElementById('progressBar'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            playlist: document.getElementById('playlist'),
            playlistCount: document.getElementById('playlistCount'),
            loading: document.getElementById('loading')
        };
    }
    
    bindEvents() {
        var self = this;
        
        this.elements.searchBtn.onclick = function() {
            self.search();
        };
        
        this.elements.searchInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                self.search();
            }
        };
        
        this.elements.playBtn.onclick = function() {
            self.togglePlay();
        };
        
        this.elements.prevBtn.onclick = function() {
            self.previousTrack();
        };
        
        this.elements.nextBtn.onclick = function() {
            self.nextTrack();
        };
        
        this.elements.downloadBtn.onclick = function() {
            self.downloadCurrentTrack();
        };
        
        this.elements.progressBar.oninput = function() {
            self.seek(this.value);
        };
        
        this.audio.ontimeupdate = function() {
            self.updateProgress();
        };
        
        this.audio.onloadedmetadata = function() {
            self.updateDuration();
        };
        
        this.audio.onended = function() {
            self.nextTrack();
        };
    }
    
    search() {
        var keyword = this.elements.searchInput.value.trim();
        
        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }
        
        this.showLoading(true);
        
        var self = this;
        var url = 'http://ioscdn.kugou.com/api/v3/search/song?keyword=' + encodeURIComponent(keyword) + '&page=1&pagesize=20&plat=2&version=7910';
        
        console.log('搜索URL:', url);
        
        fetch(url, {
            headers: {
                'User-Agent': 'Kugou/5.2.0 (iPhone; iOS 15.0)',
                'Referer': 'http://ios.kugou.com/',
                'Accept': 'application/json'
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log('搜索结果:', data);
            
            if (data.data && data.data.info && data.data.info.length > 0) {
                var results = data.data.info.map(function(song) {
                    return {
                        id: song.hash,
                        name: song.songname,
                        artist: song.singername,
                        album: song.album_name || '未知专辑',
                        duration: (song.duration || 180) * 1000,
                        picUrl: song.img || 'https://picsum.photos/300/300?random=' + Math.random(),
                        hash: song.hash,
                        source: 'kg'
                    };
                });
                
                self.searchResults = results;
                self.displayResults(results);
            } else {
                self.displayResults([]);
                alert('未找到歌曲');
            }
            
            self.showLoading(false);
        })
        .catch(function(error) {
            console.error('搜索失败:', error);
            alert('搜索失败: ' + error.message);
            self.showLoading(false);
        });
    }
    
    displayResults(results) {
        var container = this.elements.resultsList;
        container.innerHTML = '';
        
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>未找到歌曲</p></div>';
            this.elements.resultCount.textContent = '(0)';
            return;
        }
        
        this.elements.resultCount.textContent = '(' + results.length + ')';
        
        var self = this;
        for (var i = 0; i < results.length; i++) {
            (function(index) {
                var track = results[index];
                var item = document.createElement('div');
                item.className = 'track-item';
                
                item.innerHTML = '<img class="track-cover" src="' + (track.picUrl || '/default-album.png') + '" alt="' + track.name + '">' +
                    '<div class="track-info">' +
                    '<div class="track-name">' + track.name + '</div>' +
                    '<div class="track-artist">' + track.artist + '</div>' +
                    '</div>' +
                    '<button class="btn-play-track">播放</button>';
                
                item.onclick = function() {
                    self.playTrack(results, index);
                };
                
                container.appendChild(item);
            })(i);
        }
    }
    
    playTrack(tracks, index) {
        if (!tracks || index >= tracks.length) return;
        
        this.playlist = tracks;
        this.currentIndex = index;
        this.currentTrack = tracks[index];
        
        this.updateNowPlaying();
        this.updatePlaylistUI();
        
        this.showLoading(true);
        
        var self = this;
        var hash = this.currentTrack.hash;
        
        console.log('获取播放链接，hash:', hash);
        
        // 使用抓包中的接口格式
        var url = 'http://media.store.kugou.com/v2/get_play_url?hash=' + hash + '&plat=2&version=7910&appid=' + this.config.appid;
        
        console.log('播放链接URL:', url);
        
        fetch(url, {
            headers: {
                'User-Agent': 'Kugou/5.2.0 (iPhone; iOS 15.0)',
                'Referer': 'http://ios.kugou.com/',
                'Accept': 'application/json'
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log('播放链接响应:', data);
            
            if (data.status === 1 && data.data && data.data.play_url) {
                var playUrl = data.data.play_url;
                
                console.log('播放URL:', playUrl);
                
                self.audio.src = playUrl;
                self.audio.play().then(function() {
                    self.isPlaying = true;
                    self.elements.playBtn.textContent = '⏸';
                    self.showLoading(false);
                }).catch(function(err) {
                    console.error('播放失败:', err);
                    alert('播放失败');
                    self.showLoading(false);
                });
            } else {
                throw new Error('无法获取播放链接');
            }
        })
        .catch(function(error) {
            console.error('获取播放链接失败:', error);
            alert('获取播放链接失败: ' + error.message);
            self.showLoading(false);
        });
    }
    
    togglePlay() {
        if (!this.currentTrack) {
            alert('请先选择歌曲');
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.elements.playBtn.textContent = '▶';
        } else {
            this.audio.play().then(function() {
                this.isPlaying = true;
                this.elements.playBtn.textContent = '⏸';
            }.bind(this)).catch(function(err) {
                console.error('播放失败:', err);
            });
        }
    }
    
    previousTrack() {
        if (this.currentIndex > 0) {
            this.playTrack(this.playlist, this.currentIndex - 1);
        }
    }
    
    nextTrack() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.playTrack(this.playlist, this.currentIndex + 1);
        }
    }
    
    updateNowPlaying() {
        if (!this.currentTrack) return;
        
        this.elements.trackName.textContent = this.currentTrack.name;
        this.elements.trackArtist.textContent = this.currentTrack.artist + ' - ' + this.currentTrack.album;
        
        if (this.currentTrack.picUrl) {
            this.elements.albumArt.src = this.currentTrack.picUrl;
        } else {
            this.elements.albumArt.src = '/default-album.png';
        }
    }
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        var percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressBar.value = percent;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }
    
    seek(value) {
        if (!this.audio.duration) return;
        var time = (value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }
    
    downloadCurrentTrack() {
        if (!this.currentTrack) {
            alert('请先选择歌曲');
            return;
        }
        
        alert('下载功能开发中...');
    }
    
    updatePlaylistUI() {
        var container = this.elements.playlist;
        container.innerHTML = '';
        
        if (this.playlist.length === 0) {
            container.innerHTML = '<div class="empty-playlist">播放列表为空</div>';
            return;
        }
        
        this.elements.playlistCount.textContent = '(' + this.playlist.length + ')';
        
        var self = this;
        this.playlist.forEach(function(track, index) {
            var item = document.createElement('div');
            item.className = 'playlist-item' + (index === self.currentIndex ? ' active' : '');
            
            item.innerHTML = '<div class="playlist-item-info">' +
                '<div class="playlist-item-name">' + track.name + '</div>' +
                '<div class="playlist-item-artist">' + track.artist + '</div>' +
                '</div>';
            
            (function(idx) {
                item.onclick = function() {
                    self.playTrack(self.playlist, idx);
                };
            })(index);
            
            container.appendChild(item);
        });
    }
    
    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.player = new MusicPlayer();
    console.log('音乐播放器初始化完成');
});
