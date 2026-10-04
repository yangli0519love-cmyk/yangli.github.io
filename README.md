# Yang Li · Interactive Robot Portfolio

浅色、内容优先的个人学术网站。首屏为个人介绍和可互动机器人，保留研究项目、教育背景、算法与工程能力、足球队队长经历；不含实习经历。

## 最省事的发布方式：单文件版

本次交付另附 `yang_li_robot_homepage.html`，已内嵌全部样式、脚本和矢量图。

1. 将该文件重命名为 `index.html`，注意不要成为 `index.html.html`。
2. 在已有 GitHub 仓库根目录上传并覆盖旧的 `index.html`，提交 Commit changes。
3. 已启用的 GitHub Pages 会根据既有发布配置重新发布。无需为了这版页面更改仓库名或重建仓库。
4. 原来的 `styles.css`、`script.js` 即使留在仓库，也不会被这个单文件版本引用。

本地预览：用普通浏览器打开单文件 HTML。网站不调用接口，不依赖 CDN，不需要 npm 或服务器构建。

## 方便维护的版本：本 ZIP

目录结构：

```text
index.html
styles.css
script.js
config.js
assets/
  favicon.svg
  ream.svg
  unimanip.svg
  anydex.svg
.nojekyll
README.md
```

将上述内容直接放到仓库根目录，而不是额外嵌套在 `yang_li_robot_website/` 子文件夹里。不要只上传 ZIP 本身。已有的 index、styles、script 应全部替换，并上传新增的 `config.js` 和 `assets/`。

尚未启用 Pages 的仓库，在 Settings → Pages 设置：Deploy from a branch → main → / (root) → Save。官方说明：
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 已实现的交互

- 在首屏移动鼠标：机器人眼睛和头部轻微跟随；空闲时会眨眼。
- 点击橙色或绿色方块：对应机械臂执行抓取、抬起、移动、放置；再次点击已放置的方块会将其送回。
- `Pick & place`：使用按钮完成相同操作，也适用于触屏。
- `Say hello`：机器人挥手。点击头部也会触发挥手。
- 重置按钮：取消当前动作并将机器人和物体恢复初始状态。
- 暂停按钮：暂停/继续动画，保留动作进度。
- `EN / 中`：切换中英文介绍与研究摘要。
- `Read overview`：打开完整研究简介；支持 Escape 关闭。
- 方块支持 Tab 焦点、Enter/空格激活。
- 页面离开可视区域或浏览器标签页隐藏时停止动画循环。
- 尊重系统“减少动态效果”设置：取消连续动画，抓取按钮改为直接呈现结果。

机器人是原创 SVG 拟三维概念角色，使用二维双连杆逆运动学和预设动画状态机；不是 WebGL 模型、真实机器人控制器、VLM 推理接口或实验录像。研究配图同样标明为概念示意。

## 填入真实链接

多文件版本直接编辑 `config.js`。未知链接留空，会自动隐藏；不要放假链接或私人账号密钥。

```js
window.SITE_CONFIG = {
  github: "https://github.com/yangli0519love-cmyk",
  email: "",
  scholar: "",
  cv: "",        // 上传真实 CV 后可改为 "assets/CV.pdf"
  linkedin: "",
  projects: {
    ream: { paper: "", code: "", video: "" },
    unimanip: { paper: "", code: "", video: "" },
    anydex: { paper: "", code: "", video: "" },
    vlai: { paper: "", code: "" },
    mistype: { paper: "", code: "" }
  }
};
```

单文件版搜索 `window.SITE_CONFIG =`，修改同样的配置。两种版本是独立副本，修改一份不会自动更新另一份。

## 改个人介绍和论文内容

- `index.html` 中的 `data-en` / `data-zh` 分别是英文和中文。
- 同一个带翻译属性的元素也有默认英文正文；修改时请同步修改属性和正文。
- 页面末尾 `id="project-data"` 的 JSON 保存弹窗的完整简介。`summary`、`detail`、`focus` 等数组按 `[英文, 中文]` 排列。
- 已保留 REAM、UniManip、AnyDexManip、VLAI 和中文 IME-based mistype 鲁棒性研究。
- 未补写未确认的论文年份、录用状态、作者排序、性能指标、电子邮箱、Scholar 或 CV 链接。
- NTU 教育信息以 M.Sc. 与 School of Electrical & Electronic Engineering 表述；没有猜测更具体的学位专业名称或授位日期。
- 研究文字依据用户在对话中提供的工作描述及旧网站整理，不替代论文正式摘要。公开发布前应由作者核对技术细节。

## 技术与检查

纯 HTML / CSS / 原生 JavaScript，使用系统字体。无外部字体文件、框架、统计脚本、后端、API 密钥或第三方动画依赖。浏览器只将语言偏好保存在 localStorage。

已在 Chromium 浏览器渲染环境检查 320–1920 px 共 12 个宽度；未检测到横向溢出或缺失图片。已测试两种方块抓取、挥手、重置、暂停/继续、键盘激活、中英切换、研究弹窗和减少动态效果。尚未对所有浏览器版本进行逐一测试。

这次交付只生成了网站文件，没有代替用户向 GitHub 提交或修改线上设置。
