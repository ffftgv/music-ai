# 青听音乐 - 多源音乐播放器

基于 Cloudflare Workers + Pages 构建的纯前端多源音乐播放器。

## 功能特性

- 多音源支持（网易云、QQ音乐、酷狗、酷我）
- 音质选择（128kbps/320kbps/FLAC/Hi-Res）
- 在线播放和下载
- 播放列表管理
- 响应式设计
- PWA支持

## 部署到 Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 进入 Pages 服务
3. 选择 "Upload assets"
4. 上传 public 文件夹中的所有文件
5. 或直接连接 Git 仓库自动部署

## 项目结构

```
qing-music-player/
├── functions/          # API 代理函数
│   └── api/
│       ├── search.js  # 搜索接口
│       └── play.js    # 播放链接接口
├── public/            # 前端文件
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── icons/
├── wrangler.toml     # Cloudflare 配置
└── README.md
```

## 使用说明

1. 在搜索框输入关键词
2. 选择音源（网易云/QQ音乐/酷狗/酷我）
3. 点击搜索按钮
4. 点击歌曲右侧的播放按钮
5. 选择音质并播放
6. 可下载歌曲到本地

## 注意事项

- 本应用仅供个人学习使用
- 请遵守相关版权法律法规
- API 接口可能随时变化

## 技术栈

- 前端：HTML5 + CSS3 + Vanilla JavaScript
- 后端：Cloudflare Workers (Pages Functions)
- 部署：Cloudflare Pages

---

**快速开始**：下载项目 -> 部署到 Cloudflare -> 开始使用！
