> 当前部署位置：E:\work\docker-base\ov-records-portal。登录密码由本机.env配置，不随源码发布。
> 当前Compose显式复用已有外部卷 ov-records-portal_portal_data，保留原有资料及OV连接配置。迁往其他机器时请先恢复该卷，或先运行 docker volume create ov-records-portal_portal_data 创建空卷。

# 记录入库工作台

Windows Docker Desktop 上运行的 B/S 应用，适配现有 OpenViking HTTP API。浏览器负责上传和可选补录；服务端保留原件、去重、排队、查询OV任务并单独同步资料说明。无需npm安装，运行环境为Node.js 24（含内置SQLite）。

## v1.1 自动采集与人工审核

v1.0已封版，Git标签为`v1.0-manual`与`工作记录入库平台-v1.0-手动导入`。[封版发布页](https://github.com/bobolv/OV-KNOWLEDGE-Import/releases/tag/v1.0-manual)。

新流程：Codex定时检索公开知识 → 自动生成摘要、标签、来源和适用范围 → 保存“待导入 · 待审核” → 人工检查与补录 → 点击“审核通过并导入 OV”。批量导入自动跳过未审核和退回资料。修改摘要或属性后需要重新审核。

操作和采集接口契约见[采集SOP](docs/COLLECTOR.md)，部署及回退见[v1.1说明](docs/RELEASE-v1.1.md)。摘要由Codex定时任务生成，工作台不另行调用模型，不要求额外模型API Key。自动任务凭据只有采集权限，无法使用审核、导入或配置接口；独立用户和不可抵赖的身份签名不在本版本范围，审核人名称为自行填写。

## 启动

在此目录运行 `powershell -ExecutionPolicy Bypass -File .\start.ps1`，设置至少6字符的工作台密码。程序生成本地 `.env` 并运行 `docker compose up -d --build`。随后访问 http://127.0.0.1:8787。

连接设置中填写 `http://host.docker.internal:1933` 和现有 OV 的 API Key，保存后测试连接。不要填 `/studio/home`。这里的密码为工作台密码，与 OV API Key 不同。API Key 留空保存表示保留已有密钥。密钥在SQLite中加密，解密密钥在同一Docker数据卷，属于本机静态存储保护，不是外部密钥管理服务。

当前应用面向单一可信操作者/共享项目空间。Docker端口绑定127.0.0.1和本机Tailscale地址100.123.88.7；Tailscale访问地址为http://100.123.88.7:8787。仍为单一可信操作者/共享项目空间，不是多人、多租户平台。访问范围由接入的OV密钥决定，项目名称不是安全边界。上公网需另做HTTPS、独立用户和权限隔离。

## 使用

1. 选择或拖入一批文件；项目和背景选填。文件先存本机，不立即发送到OV。
2. 在详情可补录事件、时间原话、人员、进展、后续事项、标签和使用目的，未知留空。
3. 点击“导入 OV”，也可在资料库批量导入全部待导入文件。接收、排队、处理中、完成分别显示；只在源内容与说明两次任务都完成后显示已入库。
4. 导入后修改补录，点击“同步资料说明”，不重复上传已成功的源内容。
5. “回读验证”检查说明可读取及编号一致；不冒充全面语义检索验收。
6. 查询失败自动继续；提交响应丢失进入“结果待核对”，可在详情关联OV现有task_id。不会盲目重复提交。

## 格式

- OV原生文档列表：DOC/DOCX/DOCM/ODT/RTF、XLS/XLSX/XLSM/XLSB/ODS/CSV、TXT/MD、PDF、PPT/PPTX、HTML、EPUB。
- JPG/JPEG/PNG/GIF/WEBP/BMP：交OV处理，图片理解依赖VLM且属于官方实验能力；扫描PDF解析能力同样需实测。
- WPS/ET：接收和保留原件；用WPS另存为DOCX/XLSX/PDF，在详情关联转换文件。系统不内置WPS，不保证专有格式原生解析，也不会仅重命名扩展名。转换副本有单独指纹。
- 单文件最大200MB；串行浏览器上传，服务端同时间最多处理两份资料。无病毒扫描器，仅用于可信工作资料；文件名和扩展名不是安全内容鉴定。

## 知识与记忆

原始内容导入独立 `.../<资料UUID>/source`，补录形成 `.../<资料UUID>/context.md`，说明中写入源资源地址、来源指纹和使用目的；补录说明既可检索，也可供后续智能体引用。不会直接伪造用户长期记忆，不调用session.commit；`reason`留空，不触发不必要的记忆提取。多文件自动事件合并、AI事件卡片生成不在本版实现范围。

OV返回的资源URI与任务编号入库存档。源内容与说明使用不同目标，防止更新一个目录时删除同级资料。每个任务保留当时连接配置；修改全局连接不会把已有任务悄悄迁移到另一个OV。相同项目及事件内、相同原件指纹去重；不同内容保留独立记录，不凭上传先后决定新旧结论。

## 持久化与运维

Docker命名卷 `portal_data`（Compose会加项目前缀）包含SQLite、原件和加密密钥。备份需要同时保存整个卷与本机`.env`；只复制SQLite将不能解密OV连接配置。停止应用后备份可获得一致快照。升级先备份，再`docker compose up -d --build`。停止用`docker compose down`，不要附带`-v`，否则会删除资料卷。

日志：`docker compose logs --tail 100`。健康：`docker compose ps`。本机密码在`.env`更改后重建容器；重启会清除登录会话，不丢失已保存记录和待查询任务。

## 测试与开发

Node.js 24：`node --test test/*.test.mjs`。直接运行时设置 `PORTAL_PASSWORD`、`OV_URL`、可选`OV_API_KEY`与`DATA_DIR`，然后`node server.mjs`；默认只监听127.0.0.1:8787。

测试覆盖格式分流、登录、重复文件、转换原件留存、真实HTTP请求协议、异步完成、补录同步、失败、提交结果未知不重复执行。模拟OV测试不等于所有Office/PDF/图片格式已经在真实OV中通过。

## 接口依据与实际核对

核对日期：2026-09-19。已读取用户本机 `http://127.0.0.1:1933/openapi.json`（健康接口报告v0.4.17.1，OpenAPI信息标注0.1.0）。确认存在：

- POST `/api/v1/resources/temp_upload` → `result.temp_file_id`
- POST `/api/v1/resources` → `result.task_id` 与资源地址
- GET `/api/v1/tasks/{task_id}` → 仅completed代表任务完成
- GET `/api/v1/content/read?uri=...` → 回读资料说明

本机任务接口未带密钥返回401，需在工作台设置中配置用户自己的OV密钥后才能做真实文件导入验证。

官方依据：[资源与格式](https://docs.openviking.ai/en/api/02-resources)、[异步任务](https://docs.openviking.ai/en/api/17-tasks)、[认证](https://docs.openviking.ai/en/api/01-overview)、[内容回读](https://docs.openviking.ai/en/api/12-content)。
