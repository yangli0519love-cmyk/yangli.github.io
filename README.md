# Yang Li — Academic Homepage

面向 2027 年机器人与具身智能方向博士申请的个人学术主页。保留原有机器人互动、研究项目、中英文切换与教育背景。

## 文件与预览

- `index.html`：个人简介、申请意向、研究、背景与联系信息。
- `styles.css`：响应式样式，末尾的 academic profile 样式调整内容层级。
- `script.js`：机器人动作、语言切换、研究弹窗与可选链接。
- `config.js`：公开邮箱、GitHub、CV、Scholar 及项目链接。
- `assets/`：原创 SVG 插图。

运行 `python3 -m http.server 8765`，访问 `http://localhost:8765`。无需构建或安装前端依赖。

## 内容维护

编辑 `data-en`、`data-zh` 时同步修改默认正文。研究弹窗内容位于 `index.html` 的 `project-data` JSON。

当前申请年份为 2027，公开邮箱为 `lyang018@e.ntu.edu`。CV、Scholar、论文和项目链接未知时保持为空；不会显示无效占位链接。提供 CV 后在 `config.js` 设置 `cv`，首页及联系区会自动显示。

研究项目沿用原有描述，未新增论文录用状态、作者顺序、性能指标或学位信息。机器人为 SVG 交互演示，不是实验录像。私人代码仓库不作为公开项目链接展示。

## 发布与检查

GitHub Pages 使用 `main` 分支根目录。提交这五个源文件及现有 assets 即可，不使用旧的单文件导出版本。

本次检查：JavaScript 语法；Chromium 在 320、390、768、1024、1440 px 下的中英文布局与横向溢出；机器人按钮、研究弹窗及浏览器脚本错误。此记录仅表示本次检查范围，不代表所有浏览器均已验证。
