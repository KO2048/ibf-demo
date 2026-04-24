# ifafa Todo Ledger

## Header

- 当前阶段：Phase 1 - 稳定观察窗版 Demo
- 当前目标：以“逼近感成立 → 不难抓到劝退 → 稳手更好抓”为优先级，稳定“观察窗 + 追近 + 入框 + timing + 甩动”闭环，并完成下一轮 iPhone Safari 实测
- 当前主线说明：`main` 承载单机 Demo 主线；先稳定当前观察窗实现，再验证、再调参、再扩展
- 最近基线 commit：`3f0ad7d` `Advance observation-window demo baseline`
- 最近实机测试日期：`2026-04-24`（iPhone 16 Pro / Safari，基于最新截图反馈）
- 当前设备目标：`iPhone Safari` 主目标，桌面浏览器仅作调试辅助
- 当前工作区备注：本地存在未提交的“观察窗 + 追近 + 稳手惊走”改动，需先做稳定性验证后再推进下一系统

## Maintenance Rules

- 当前仓库的计划、待办、遗留项、验证记录，以本文件为单一事实来源
- `mvp-note-md/` 保留为历史来源目录，不再继续写入当前执行任务
- 默认维护人：`Codex`
- `KO` 可在特殊情况下直接浏览、补充、修改 `todo.md`；这视为正式协作输入，不视为冲突
- 当前线程视为本项目的专属 `todo` 对话入口；后续 `KO` 在这里给出的需求、备忘、体验反馈，默认都应整理进本文件对应区块
- 所有新计划先落本文件，再决定是否同步到 [README.md](/Users/sylar/Desktop/projects/ifafa/README.md)
- `Now`、`Next`、`Backlog`、`Imported Legacy` 统一使用审计字段与实现归属字段：
  `填写人`、`填写时间`、`最后修改人`、`最后修改时间`、`实现于计划`、`实现于版本`、`实现于 Commit`、`完成时间`
- `填写人 / 填写时间` 只记录首次创建者与首次创建时间，默认不改
- `最后修改人 / 最后修改时间` 记录最近一次实质字段修改者与时间
- `实现于计划 / 实现于版本 / 实现于 Commit / 完成时间` 用来记录该任务最终在哪次计划、哪个版本或 commit 中完成
- 如果 `KO` 手动新增或修改任务，统一写 `KO`；我后续接手时保留你的创建信息，只更新最后修改信息
- `Memo / Watchlist`、`Decision Log`、`Change Log` 不强制表格审计，但每条记录都要显式写出时间和记录人
- 每次 push 后，都要在 `Change Log` 追加 commit 与任务状态变化
- 每次 iPhone 实测后，都要更新对应任务的 `Validation` 字段，或写入 `Memo / Watchlist`
- `KO` 默认只需要给出用户级体验反馈，不负责判断技术方案是否对；`Codex` 负责把体感翻译成参数收敛或结构调整
- 后续每轮体验优化按固定优先级推进：`逼近感成立` → `可抓性不过低` → `稳手沉浸感增强`
- 历史遗留项不删除，只允许改状态为 `deferred` / `archived` / `done`
- `done.md` 保存完整完成档案；`todo.md` 只保留完成摘要和状态流转入口

## Now

| ID | Title | Category | Status | Priority | Origin Time | Origin Source | Origin Ref | Current Phase | 填写人 | 填写时间 | 最后修改人 | 最后修改时间 | 实现于计划 | 实现于版本 | 实现于 Commit | 完成时间 | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOW-001 | 稳定观察窗坐标体系与追逐辅助 | engineering | active | P0 | 2026-04-24 | plan | 观察窗 + 追近 + 稳手惊走计划 | Phase 1 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 20:12 CST | 后置摄像头主路径确认后的观察窗诊断计划 | `observe-v1` |  |  | 已加入 `?observeDebug=1` 调试层与 `scripts/observe-diagnostics.js`；后摄离线模拟通过，前摄异常分支也按镜像语义输出调试值；待 iPhone 后摄复测“追近 / 看丢 / 惊走”三类问题 | 先定位是方向反了、助力偏弱，还是近距离 startle 过敏；暂不改主玩法结构；用户反馈当前捕获区位置偏高，后续应调整到画面居中，更符合直觉和习惯 |
| NOW-002 | iPhone Safari 验证“追近 / 看丢 / 惊走”三段体验 | ux | active | P0 | 2026-04-24 | plan | 观察窗 + 追近 + 稳手惊走计划 | Phase 2 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 20:12 CST | TBD | TBD |  |  | 待下一轮 GitHub Pages 实测；新增观察项：确认用户是否不再觉得需要往偏上的位置抓 | 成功标准：追它有帮助、不会太难、追错更像看丢、动作轻一点更好抓、整体更像在追蝴蝶 |
| NOW-003 | 给页面加入可见 build / version 标记 | process | active | P1 | 2026-04-24 | user-feedback | GitHub Pages 缓存混淆反馈 | Phase 1 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 19:41 CST | Build 标记一致性修复计划 | `observe-v1` |  |  | 页面已改为由 `BUILD_INFO` 渲染 `build observe-v1 · main`；真实 commit 改由 `Change Log` 追溯 | 用于实机测试时确认缓存与 build 对应关系，避免 UI 文案与真实 commit 再次过期 |

## Next

| ID | Title | Category | Status | Priority | Origin Time | Origin Source | Origin Ref | Current Phase | 填写人 | 填写时间 | 最后修改人 | 最后修改时间 | 实现于计划 | 实现于版本 | 实现于 Commit | 完成时间 | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NEXT-001 | 调优 pursuit far / mid / near 参数与 startle 阈值 | engineering | next | P1 | 2026-04-24 | plan | 观察窗 + 追近 + 稳手惊走计划 | Phase 2 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 19:15 CST | TBD | TBD |  |  | 待本轮实机反馈 | 只允许按结果优先级调参：先逼近感，再可抓性，最后稳手感 |
| NEXT-002 | 整理当前主玩法说明与 README 对齐 | process | next | P1 | 2026-04-24 | plan | 观察窗 + 追近 + 稳手惊走计划 | Phase 2 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | README 已初步同步；待本轮体验稳定后复核 | 文案要与真实主循环一致，避免 README 超前表述 |

## Backlog

| ID | Title | Category | Status | Priority | Origin Time | Origin Source | Origin Ref | Current Phase | 填写人 | 填写时间 | 最后修改人 | 最后修改时间 | 实现于计划 | 实现于版本 | 实现于 Commit | 完成时间 | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BACKLOG-001 | 正式分层蝴蝶素材实验 | asset | deferred | P2 | 2026-04-23 | plan | 前序 GPT-image / 任务 2 计划 | Phase 4 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 未开始 | 当前先用 sliced rig，等主循环稳定后再重启 |
| BACKLOG-002 | 结果页获得感增强 | ux | deferred | P2 | 2026-04-22 | doc | [TASKS.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/TASKS.md.md) | Phase 4 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 未开始 | 当前不是最优先级，先稳主循环 |
| BACKLOG-003 | geolocation 调试显示 | research | deferred | P2 | 2026-04-22 | doc | [TASKS.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/TASKS.md.md) | Phase 4 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 未开始 | 位置能力仍保留，但不抢当前 Demo 验证顺序 |
| BACKLOG-004 | 单点 geofence 测试模式 | research | deferred | P2 | 2026-04-22 | doc | [TASKS.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/TASKS.md.md) | Phase 4 | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 未开始 | 等 geolocation 基本能力恢复后再打开 |

## Imported Legacy

| ID | Title | Category | Status | Priority | Origin Time | Origin Source | Origin Ref | Current Phase | 填写人 | 填写时间 | 最后修改人 | 最后修改时间 | 实现于计划 | 实现于版本 | 实现于 Commit | 完成时间 | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LEGACY-001 | Safari 权限流程 | process | done | P2 | 2026-04-22 | doc | [TASKS.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/TASKS.md.md) | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | Safari 权限流程修复阶段 | `baseline-pre-history` |  | 2026-04-22 | 当前主线已具备 camera / motion 权限请求基础 | 后续若出现 Safari 回归，再重新激活 |
| LEGACY-002 | 位置 / geofence 作为下一阶段目标 | research | deferred | P2 | 2026-04-22 | doc | [PROJECT.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/PROJECT.md.md) | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 尚未回到执行顺序前列 | 作为历史产品方向保留 |
| LEGACY-003 | 搜索 / 锁定 / 压圈 / 撒网捕获系统 | product | archived | P3 | 2026-04-23 | branch | `codex/捕获趣味性v` @ `9a855a9` | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | 捕获乐趣实验线 | `9a855a9` | `9a855a9` | 2026-04-23 | 不直接并回 `main` | 只保留为玩法灵感来源 |
| LEGACY-004 | 真实蝴蝶 PNG 接入 | asset | done | P2 | 2026-04-23 | commit | `971166c` `Add real butterfly assets for MVP testing` | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | 真实素材接入阶段 | `971166c` | `971166c` | 2026-04-23 | 已在主线完成 | 作为当前素材基线保留 |
| LEGACY-005 | 未来正式分层素材实验 | asset | deferred | P2 | 2026-04-23 | commit | `971166c` 与前序素材计划 | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | TBD | TBD |  |  | 未开始 | 与 BACKLOG-001 对应，为资产来源项 |
| LEGACY-006 | 恢复飞行捕捉基线 | process | done | P2 | 2026-04-23 | commit | `3a601e1` `Restore flying capture baseline on main` | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | 主线纠偏恢复阶段 | `3a601e1` | `3a601e1` | 2026-04-23 | 已完成 | 记录一次重要主线纠偏动作 |
| LEGACY-007 | 主线被错误玩法覆盖的流程防护 | process | done | P1 | 2026-04-23 | commit | `df703de` / `2c5b6c6` / `3a601e1` | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | 主线流程防护规则固化 | `3a601e1` | `3a601e1` | 2026-04-23 | README 已加入分支协作约束 | 作为后续 Git 守门规则来源 |
| LEGACY-008 | timing 条主玩法提取 | product | done | P2 | 2026-04-24 | commit | `d52c717` / `39ae146` / `8018b29` | Historical | Codex | 2026-04-24 17:33 CST | Codex | 2026-04-24 17:45 CST | timing 条主玩法提取与贴附调优 | `8018b29` | `8018b29` | 2026-04-24 | 已落地为当前主循环前序版本 | 是观察窗版之前的直接上游 |

## Done Summary

| ID | Title | 完成时间 | 实现于版本 | 实现于 Commit | 来源引用 | 详情索引 |
| --- | --- | --- | --- | --- | --- | --- |
| LEGACY-001 | Safari 权限流程 | 2026-04-22 | `baseline-pre-history` |  | [TASKS.md.md](/Users/sylar/Desktop/projects/ifafa/mvp-note-md/TASKS.md.md) | [done.md#legacy-001---safari-权限流程](/Users/sylar/Desktop/projects/ifafa/done.md) |
| LEGACY-004 | 真实蝴蝶 PNG 接入 | 2026-04-23 | `971166c` | `971166c` | `971166c` | [done.md#legacy-004---真实蝴蝶-png-接入](/Users/sylar/Desktop/projects/ifafa/done.md) |
| LEGACY-006 | 恢复飞行捕捉基线 | 2026-04-23 | `3a601e1` | `3a601e1` | `3a601e1` | [done.md#legacy-006---恢复飞行捕捉基线](/Users/sylar/Desktop/projects/ifafa/done.md) |
| LEGACY-007 | 主线被错误玩法覆盖的流程防护 | 2026-04-23 | `3a601e1` | `3a601e1` | `df703de / 2c5b6c6 / 3a601e1` | [done.md#legacy-007---主线被错误玩法覆盖的流程防护](/Users/sylar/Desktop/projects/ifafa/done.md) |
| LEGACY-008 | timing 条主玩法提取 | 2026-04-24 | `8018b29` | `d52c717 / 39ae146 / 8018b29` | `d52c717 / 39ae146 / 8018b29` | [done.md#legacy-008---timing-条主玩法提取](/Users/sylar/Desktop/projects/ifafa/done.md) |

## Memo / Watchlist

- 2026-04-24 17:45 CST · Codex：当前观察窗实现仍是本地未提交状态；在 push 前，优先确认没有运行时错误与明显坐标错位。
- 2026-04-24 17:45 CST · Codex：当前 `app.js` diff 较大；在完成 iPhone 实测前，不继续叠加 geolocation、geofence 或搜索 / 锁定系统。
- 2026-04-24 17:45 CST · Codex：`codex/捕获趣味性v` 只读参考，不作为合并来源。
- 2026-04-24 17:45 CST · Codex：需要尽快把可见 build / version 标记补到页面中，降低 GitHub Pages 缓存混淆成本。
- 2026-04-24 17:45 CST · Codex：当前“手稳一些更好抓”的体验仍需实机收敛，重点观察 startle 阈值是否过敏或过钝。
- 2026-04-24 19:02 CST · Codex：页面曾使用 `build observe-v1 · 8018b29+local` 的写死标记；该策略已废弃，后续统一改为稳定 build 标签 + `Change Log` 映射 commit。
- 2026-04-24 19:15 CST · Codex：后续每轮只要求 `KO` 提供用户级体感反馈，例如“追它有帮助 / 没帮助”“太难 / 还行 / 太容易”“像看丢了 / 像逻辑怪”。
- 2026-04-24 19:40 CST · Codex：本线程已明确作为项目专属 `todo` 对话入口；后续零散需求、备忘、用户体感都可以直接丢在这里，由我整理入账。
- 2026-04-24 20:02 CST · Codex：后置摄像头已明确为当前 Demo 的唯一主体验路径；前置摄像头只作为兼容诊断对象记录，不反向影响主逻辑。
- 2026-04-24 20:02 CST · Codex：本轮新增 `?observeDebug=1` 页面调试层与 Node 离线模拟脚本，用来区分“方向反了”“助力偏弱”“近距离惊走过敏”三类问题。
- 2026-04-24 20:11 CST · Codex：即使 Safari 异常拿到前摄，调试层也会按镜像语义计算观察窗目标，避免把“前摄异常”误诊成“后摄方向全反”。
- 2026-04-24 20:12 CST · Codex：用户反馈当前捕获区位置偏高，后续应调整到画面居中；该需求本轮只记入 `todo.md`，不直接改实现。

## Decision Log

- 2026-04-24 17:33 CST · Codex：根目录 [todo.md](/Users/sylar/Desktop/projects/ifafa/todo.md) 作为当前计划、待办、遗留、验证记录的单一事实来源。
- 2026-04-24 17:33 CST · Codex：`mvp-note-md/` 降级为历史来源目录，不再继续承载当前执行计划。
- 2026-04-24 17:33 CST · Codex：当前主线顺序重排为“先稳定” → “再验证” → “再调参” → “再扩展”。
- 2026-04-24 17:33 CST · Codex：当前主玩法定义为“观察窗 + 追近 + 入框 + timing + 甩动”。
- 2026-04-24 17:33 CST · Codex：位置 / geofence、捕虫网参数系统、搜索锁定类玩法不再抢当前优先级，统一进入结构化 backlog。
- 2026-04-24 17:33 CST · Codex：历史遗留不删除，只保留来源并改状态，以便后续查验。
- 2026-04-24 17:45 CST · Codex：默认由 `Codex` 持续维护 `todo.md`；`KO` 可在特殊情况下直接补充或修改，并通过审计字段留痕。
- 2026-04-24 17:45 CST · Codex：正式任务表统一新增 `填写人 / 填写时间 / 最后修改人 / 最后修改时间` 四个审计字段。
- 2026-04-24 17:45 CST · Codex：采用 `todo.md` + `done.md` 双轨并存；`todo.md` 保留摘要，`done.md` 作为完整完成档案。
- 2026-04-24 17:45 CST · Codex：正式任务表新增 `实现于计划 / 实现于版本 / 实现于 Commit / 完成时间` 四个实现归属字段。
- 2026-04-24 19:02 CST · Codex：观察窗版 Demo 先按“收口实现 → 加版本标记 → GitHub Pages 实测 → 只调参数”的顺序推进，不在本轮打开新系统。
- 2026-04-24 19:15 CST · Codex：后续体验优化按 `逼近感成立` → `可抓性不过低` → `稳手沉浸感增强` 的结果优先级推进；`KO` 不承担技术方案判断，只判断用户感受。
- 2026-04-24 19:40 CST · Codex：当前对话正式指定为 ifafa 项目的专属需求 / 备忘入口；后续以这里的输入为 `todo.md` 更新触发源之一。
- 2026-04-24 19:41 CST · Codex：页面上的 build 标记不再显示写死的 commit hash；UI 只显示稳定 build 标签，真实 commit 统一在 `todo.md` 中追溯。
- 2026-04-24 20:02 CST · Codex：后置摄像头正式锁定为观察/捕获世界的主窗口；前置摄像头仅作为异常诊断对象，不参与当前主体验设计。
- 2026-04-24 20:12 CST · Codex：本线程关于“捕获区偏高”的输入仅作为当前主线待办记录；纠正前次越界处理，不在本轮直接改产品代码。

## Change Log

- 2026-04-24 17:33 CST · Codex：初始化 `todo.md` 总账；导入来源包括 `mvp-note-md` 文档、历史 commit、遗留分支与近期用户反馈。
- 2026-04-24 17:33 CST · Codex：将当前主开发顺序正式重排为“先稳定观察窗版 Demo，再验证，再调参，再扩展”。
- 2026-04-24 17:45 CST · Codex：为正式任务表补齐审计字段，并固化 `Codex / KO` 协作维护协议。
- 2026-04-24 17:45 CST · Codex：新增 `Done Summary`，并将关键历史里程碑补齐实现归属字段。
- 2026-04-24 19:02 CST · Codex：回到观察窗版原有计划推进；本地补入低干扰 build 标记，并把 NOW-003 提前为活跃任务。
- 2026-04-24 19:15 CST · Codex：将当前主线改成“结果导向协作”模式：技术判断由 Codex 兜底，KO 只需按用户体感给反馈。
- 2026-04-24 19:40 CST · Codex：补记当前线程用途，明确这里作为项目专属 `todo` 需求与备忘入口，后续直接承接零散输入并整理入总账。
- 2026-04-24 19:41 CST · Codex：build 标记策略改为“页面只显示稳定 build 标签，真实 commit 映射放在 `todo.md`”；不再把短 hash 写进 UI。
- 2026-04-24 19:41 CST · Codex：当前 `observe-v1` build 标签对应已上线基线 commit `3f0ad7d`（`Advance observation-window demo baseline`）；后续继续沿用“UI 显示标签，日志追溯 commit”的规则。
- 2026-04-24 20:02 CST · Codex：新增观察窗诊断核心文件、`?observeDebug=1` 页面调试层与 `scripts/observe-diagnostics.js` 离线模拟脚本；本轮先定位问题来源，不改主玩法结构。
- 2026-04-24 20:11 CST · Codex：补充前摄异常分支的镜像调试语义；后摄主路径不变，诊断时避免把异常前摄误读成后摄追逐方向 bug。
- 2026-04-24 20:12 CST · Codex：纠正前次越界操作，撤回“捕获区居中 / 飞行中心下调”相关实现，只将用户反馈记入当前主线 `todo` 与验证项。
