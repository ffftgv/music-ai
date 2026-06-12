
/**
 * 青听音乐播放器 - 主逻辑（最终修复版）
 */
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
        // 搜索按钮
        this.elements.searchBtn.addEventListener('click', () => {
            console.log('Search button clicked');
            this.search();
        });
        
        // 回车键搜索
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                this.search();
            }
        });
        
        // 播放控制
        this.elements.playBtn.addEventListener('click', () => {
            console.log('Play button clicked');
            this.togglePlay();
        });
        
        this.elements.prevBtn.addEventListener('click', () => {
            console.log('Prev button clicked');
            this.previousTrack();
        });
        
        this.elements.nextBtn.addEventListener('click', () => {
            console.log('Next button clicked');
            this.nextTrack();
        });
        
        this.elements.downloadBtn.addEventListener('click', () => {
            console.log('Download button clicked');
            this.downloadCurrentTrack();
        });
        
        // 进度条
        this.elements.progressBar.addEventListener('input', (e) => {
            this.seek(e.target.value);
        });
        
        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.elements.playBtn.textContent = '\u23F8';
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.elements.playBtn.textContent = '\u25B6';
        });
    }
    
    async search() {
        const keyword = this.elements.searchInput.value.trim();
        const source = this.elements.sourceSelect.value;
        
        console.log('Searching for:', keyword, 'source:', source);
        
        if (!keyword) {
            alert('Please enter a keyword');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const url = '/api/search?keyword=' + encodeURIComponent(keyword) + '&source=' + source;
            console.log('Search URL:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            const results = await response.json();
            console.log('Search results:', results);
            
            if (Array.isArray(results) && results.length > 0) {
                this.searchResults = results;
                this.displayResults(results);
            } else {
                this.displayResults([]);
                alert('No songs found');
            }
            
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    displayResults(results) {
        const container = this.elements.resultsList;
        container.innerHTML = '';
        
        if (!Array.isArray(results) || results.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No songs found</p></div>';
            this.elements.resultCount.textContent = '(0)';
            return;
        }
        
        this.elements.resultCount.textContent = '(' + results.length + ')';
        
        results.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'track-item';
            
            const picUrl = track.picUrl || '/default-album.png';
            const name = this.escapeHtml(track.name);
            const artist = this.escapeHtml(track.artist);
            
            item.innerHTML = '<img class="track-cover" src="' + picUrl + '" alt="' + name + '">' +
                '<div class="track-info">' +
                '<div class="track-name">' + name + '</div>' +
                '<div class="track-artist">' + artist + '</div>' +
                '</div>' +
                '<button class="btn-play-track" data-index="' + index + '">Play</button>';
            
            item.addEventListener('click', () => {
                console.log('Song clicked:', track.name);
                this.playTrack(results, index);
            });
            
            container.appendChild(item);
        });
    }
    
    async playTrack(tracks, index) {
        if (!Array.isArray(tracks) || index >= tracks.length) {
            console.error('Invalid play parameters');
            return;
        }
        
        this.playlist = tracks;
        this.currentIndex = index;
        this.currentTrack = tracks[index];
        
        console.log('Playing:', this.currentTrack.name);
        
        this.updateNowPlaying();
        this.updatePlaylistUI();
        
        const source = this.elements.sourceSelect.value;
        const quality = this.elements.qualitySelect.value;
        
        this.showLoading(true);
        
        try {
            let playUrl = null;
            
            if (this.currentTrack.playUrl) {
                playUrl = this.currentTrack.playUrl;
                console.log('Using playUrl from search:', playUrl);
            } else {
                const url = '/api/play?id=' + this.currentTrack.id + '&source=' + source + '&quality=' + quality;
                console.log('Fetching play URL:', url);
                
                const response = await fetch(url);
                const data = await response.json();
                
                console.log('Play URL response:', data);
                
                if (data.url) {
                    playUrl = data.url;
                }
            }
            
            if (playUrl) {
                console.log('Setting audio src:', playUrl);
                this.audio.src = playUrl;
                await this.audio.play();
                console.log('Playback started');
            } else {
                throw new Error('No play URL found');
            }
            
        } catch (error) {
            console.error('Play failed:', error);
            alert('Play failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    togglePlay() {
        if (!this.currentTrack) {
            alert('Please select a song first');
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(err => {
                console.error('Play failed:', err);
                alert('Play failed, please try again');
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
        this.elements.trackArtist.textContent = this.currentTrack.artist + ' - ' + (this.currentTrack.album || 'Unknown Album');
        
        if (this.currentTrack.picUrl) {
            this.elements.albumArt.src = this.currentTrack.picUrl;
        } else {
            this.elements.albumArt.src = '/default-album.png';
        }
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
            alert('Please select a song first');
            return;
        }
        
        try {
            let downloadUrl = null;
            
            if (this.currentTrack.playUrl) {
                downloadUrl = this.currentTrack.playUrl;
            } else {
                const source = this.elements.sourceSelect.value;
                const quality = this.elements.qualitySelect.value;
                const response = await fetch('/api/play?id=' + this.currentTrack.id + '&source=' + source + '&quality=' + quality);
                const data = await response.json();
                downloadUrl = data.url;
            }
            
            if (downloadUrl) {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = this.currentTrack.name + ' - ' + this.currentTrack.artist + '.mp3';
                link.click();
            }
        } catch (error) {
            alert('Download failed: ' + error.message);
        }
    }
    
    updatePlaylistUI() {
        const container = this.elements.playlist;
        container.innerHTML = '';
        
        if (this.playlist.length === 0) {
            container.innerHTML = '<div class="empty-playlist">Playlist is empty</div>';
            return;
        }
        
        this.elements.playlistCount.textContent = '(' + this.playlist.length + ')';
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item' + (index === this.currentIndex ? ' active' : '');
            
            const name = this.escapeHtml(track.name);
            const artist = this.escapeHtml(track.artist);
            
            item.innerHTML = '<div class="playlist-item-info">' +
                '<div class="playlist-item-name">' + name + '</div>' +
                '<div class="playlist-item-artist">' + artist + '</div>' +
                '</div>';
            
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
        } catch (e) {
            console.error('Save playlist failed:', e);
        }
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
        } catch (e) {
            console.error('Load playlist failed:', e);
        }
    }
    
    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize player
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Music Player...');
    window.player = new MusicPlayer();
    console.log('Music Player initialized');
});
