# 无需下载的网页试玩

用户已授权将游戏源码推送至 `AbrahamChan1965/AbrahamChan1965` 并公开发布试玩网页。

## 发布内容

`docs/index.html` 包含嵌入的全部脚本、样式与向量画面，`docs/.nojekyll` 关闭不需要的Jekyll处理。源码与设计文档保留在仓库根目录。

重建发布文件：

```bash
npm ci --cache /tmp/road-npm-cache
npm run prepare:pages
```

检查差异后正常提交、推送到main，不强制推送。Pages启用后，main分支中docs内容的更新自动重新发布。

## 首次启用GitHub Pages

仓库 Settings → Pages → Build and deployment：

1. Source选择 **Deploy from a branch**。
2. Branch选择 **main**。
3. 文件夹选择 **/docs**。
4. 点击 **Save**。

不需要自定义Actions工作流。用户需要拥有仓库管理员权限。若API可用，也可通过GitHub Pages API启用main/docs来源。

部署完成以GitHub给出的网址为准，实际访问成功前不能宣称网页已发布。开发环境的API代理拒绝与Git推送权限不同，须分别核验。发布后检查实际页面、地图、移动与回合变化。

## 数据边界

只发布静态游戏和源码，不发布凭据。进度与反思保存在玩家浏览器，游戏没有上传接口。页面托管服务本身可能记录常规访问日志；项目未添加分析或外部AI服务。
