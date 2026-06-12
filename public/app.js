class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.searchResults = [];
        
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
        this.elements.searchBtn.addEventListener('click', () => this.search());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
        
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.previousTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadCurrentTrack());
        
        this.elements.progressBar.addEventListener('input', (e) => {
            this.seek(e.target.value);
        });
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e);
            this.showNotification('播放失败，尝试下一首', 'error');
            setTimeout(() => this.nextTrack(), 2000);
        });
    }
    
    async search() {
        const keyword = this.elements.searchInput.value.trim();
        const source = this.elements.sourceSelect.value;
        
        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}&source=${source}`);
            const results = await response.json();
            
            console.log('搜索结果:', results);
            
            if (Array.isArray(results) && results.length > 0) {
                this.searchResults = results;
                this.displayResults(results);
            } else {
                this.displayResults([]);
                this.showNotification('未找到相关歌曲', 'info');
            }
            
            this.showLoading(false);
        } catch (error) {
            console.error('搜索失败:', error);
            this.showNotification('搜索失败: ' + error.message, 'error');
            this.showLoading(false);
        }
    }
    
    displayResults(results) {
        const container = this.elements.resultsList;
        container.innerHTML = '';
        
        if (!Array.isArray(results) || results.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>未找到相关歌曲</p></div>';
            this.elements.resultCount.textContent = '(0)';
            return;
        }
        
        this.elements.resultCount.textContent = `(${results.length})`;
        
        results.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'track-item';
            item.innerHTML = `
                <div class="track-info">
                    <div class="track-name">${this.escapeHtml(track.name)}</div>
                    <div class="track-artist">${this.escapeHtml(track.artist)}</div>
                </div>
                <button class="btn-play-track" data-index="${index}">播放</button>
            `;
            
            item.addEventListener('click', () => {
                this.playTrack(results, index);
            });
            
            container.appendChild(item);
        });
    }
    
    async playTrack(tracks, index) {
        if (!Array.isArray(tracks) || index >= tracks.length) return;
        
        this.playlist = tracks;
        this.currentIndex = index;
        this.currentTrack = tracks[index];
        
        this.updateNowPlaying();
        this.updatePlaylistUI();
        
        const source = this.elements.sourceSelect.value;
        const quality = this.elements.qualitySelect.value;
        
        this.showLoading(true);
        
        try {
            let playUrl = null;
            
            // 如果搜索结果中已经有播放链接，直接使用
            if (this.currentTrack.playUrl) {
                playUrl = this.currentTrack.playUrl;
            } else {
                // 否则通过 API 获取
                const response = await fetch(`/api/play?id=${this.currentTrack.id}&source=${source}&quality=${quality}`);
                const data = await response.json();
                
                if (data.url) {
                    playUrl = data.url;
                }
            }
            
            if (playUrl) {
                console.log('播放链接:', playUrl);
                
                await this.loadAndPlay(playUrl);
                this.savePlaylist();
            } else {
                throw new Error('无法获取播放链接');
            }
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('播放失败:', error);
            this.showNotification('播放失败: ' + error.message, 'error');
            this.showLoading(false);
            
            setTimeout(() => this.nextTrack(), 2000);
        }
    }
    
    async loadAndPlay(url) {
        return new Promise((resolve, reject) => {
            this.audio.src = url;
            
            const onCanPlay = () => {
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                
                this.audio.play().then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            };
            
            const onError = (e) => {
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                reject(new Error('音频加载失败'));
            };
            
            this.audio.addEventListener('canplay', onCanPlay);
            this.audio.addEventListener('error', onError);
            
            this.audio.load();
        });
    }
    
    togglePlay() {
        if (!this.currentTrack) return;
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            if (this.audio.src) {
                this.audio.play().catch(err => {
                    console.error('播放失败:', err);
                    this.showNotification('播放失败，请点击页面任意位置后重试', 'error');
                });
            }
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
        this.elements.trackArtist.textContent = `${this.currentTrack.artist} - ${this.currentTrack.album || '未知专辑'}`;
        
        if (this.currentTrack.picUrl) {
            this.elements.albumArt.src = this.currentTrack.picUrl;
        } else {
            this.elements.albumArt.src = '/default-album.png';
        }
    }
    
    updatePlayButton() {
        this.elements.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressBar.value = percent;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }
    
    seek(value) {
        if (!this.audio.duration) return;
        const time = (value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }
    
    async downloadCurrentTrack() {
        if (!this.currentTrack) {
            alert('请先选择歌曲');
            return;
        }
        
        const source = this.elements.sourceSelect.value;
        const quality = this.elements.qualitySelect.value;
        
        try {
            let downloadUrl = null;
            
            if (this.currentTrack.playUrl) {
                downloadUrl = this.currentTrack.playUrl;
            } else {
                const response = await fetch(`/api/play?id=${this.currentTrack.id}&source=${source}&quality=${quality}`);
                const data = await response.json();
                downloadUrl = data.url;
            }
            
            if (downloadUrl) {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${this.currentTrack.name} - ${this.currentTrack.artist}.mp3`;
                link.click();
            }
        } catch (error) {
            alert('下载失败: ' + error.message);
        }
    }
    
    updatePlaylistUI() {
        const container = this.elements.playlist;
        container.innerHTML = '';
        
        if (this.playlist.length === 0) {
            container.innerHTML = '<div class="empty-playlist">播放列表为空</div>';
            return;
        }
        
        this.elements.playlistCount.textContent = `(${this.playlist.length})`;
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === this.currentIndex) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-name">${this.escapeHtml(track.name)}</div>
                    <div class="playlist-item-artist">${this.escapeHtml(track.artist)}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.playTrack(this.playlist, index);
            });
            
            container.appendChild(item);
        });
    }
    
    savePlaylist() {
        try {
            localStorage.setItem('musicPlayerPlaylist', JSON.stringify({
                tracks: this.playlist,
                currentIndex: this.currentIndex
            }));
        } catch (e) {}
    }
    
    loadPlaylist() {
        try {
            const data = localStorage.getItem('musicPlayerPlaylist');
            if (data) {
                const parsed = JSON.parse(data);
                this.playlist = parsed.tracks || [];
                this.currentIndex = parsed.currentIndex || -1;
                this.updatePlaylistUI();
            }
        } catch (e) {}
    }
    
    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
    console.log('🎵 青听音乐播放器已启动 - 使用 QingMusic 代理');
});
