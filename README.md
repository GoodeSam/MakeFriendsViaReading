# MakeFriendsViaReading

帮同小区家长以书会友——童书赠送 / 1:1 换书 / 借阅信息撮合工具。

> 产品策略详见 [`MakeFriends.md`](./MakeFriends.md)。这里是 **v3.2 后端骨架（第一阶段）** 的代码与启动说明。

---

## 第一阶段做了什么

- ✅ FastAPI + SQLAlchemy + PostgreSQL 项目骨架
- ✅ 11 张核心数据表（用户 / 小区 / 孩子 / 书籍 / 上架 / 申请 / 会话 / 消息 / 借阅约定 / 风控标记 / 邀请码 / 邻里背书）
- ✅ 基础 API：注册登录、社区列表、ISBN 查书、上架 / 浏览、申请 / 同意 / 拒绝 / 完成、会话消息
- ✅ v3.2 关键约束已落地：
  - 高价值套书（牛津树 / 海尼曼 / RAZ / 培生 / I Can Read）系统层面禁借
  - 借阅入口需"≥1 次完成的赠送或换书"才解锁
  - 借阅会话默认带 6 个月 TTL，7 天调度窗口后只读
  - 内容审核走关键词黑名单（外联 / 二维码 / VX 暗示）
- ✅ Mock 占位：短信验证码 / ISBN 元数据 / 内容审核

## 第一阶段没做（推迟）

- ❌ 真实短信、真实 OCR、真实内容安全 API（先 mock）
- ❌ 微信小程序前端
- ❌ Alembic 迁移（暂用 `Base.metadata.create_all` 自动建表，schema 稳定后切换）
- ❌ 部署 / CI
- ❌ 借阅约定文本 4.4.4、4 张交接照片、邻里背书完整流程（数据表已建，业务流程下阶段补）

---

## 准备工作（一次性）

需要装好这两样：

| 工具                        | 检查命令               | 没有的话                                                     |
| ------------------------- | ------------------ | -------------------------------------------------------- |
| **Python 3.11+**          | `python3 --version` | macOS: `brew install python@3.12`                       |
| **Docker Desktop**（用来跑数据库） | `docker --version` | https://www.docker.com/products/docker-desktop/ 下载 dmg 安装 |

---

## 五步跑起来

```bash
# 1) 启动 PostgreSQL（在项目根目录）
docker compose up -d postgres

# 2) 进入 backend, 建虚拟环境
cd backend
python3 -m venv .venv
source .venv/bin/activate

# 3) 装依赖 + 配置环境变量
pip install -r requirements.txt
cp .env.example .env

# 4) 写入种子数据（小区、邀请码、几本书）
python -m app.seed

# 5) 启动 API
uvicorn app.main:app --reload
```

跑通后浏览器打开 **http://localhost:8000/docs** ，看到一个交互式 API 文档页面就成功了。

---

## 试一遍主流程

在 `/docs` 页面里可以直接点按钮试，下面用 `curl` 演示：

```bash
# 看看有哪些小区
curl http://localhost:8000/api/communities

# 假装发短信（控制台会打印验证码 123456）
curl -X POST http://localhost:8000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001"}'

# 用户 A 注册（社区 1，邀请码 WELCOME001）
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"13800000001",
    "code":"123456",
    "nickname":"小明妈",
    "invite_code":"WELCOME001",
    "community_id":1,
    "children_age_ranges":["3-6"]
  }'
# → 返回 access_token，记下来

# 用 token 调认证接口（替换 <TOKEN>）
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# 上架一本可赠送的书
curl -X POST http://localhost:8000/api/listings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn":"9787544291293",
    "condition_note":"九成新",
    "can_gift":true
  }'

# 浏览同小区的书
curl http://localhost:8000/api/listings -H "Authorization: Bearer <TOKEN>"
```

试一下系统层面禁借：上架 ISBN `9787221176134`（牛津阅读树）并把 `can_borrow` 设为 true，返回值里 `can_borrow` 会被强制改成 false。

---

## 项目结构

```
MakeFriendsViaReading/
├── MakeFriends.md             # 产品策略（v3.2 + Codex 多轮反馈）
├── README.md                  # 本文件
├── docker-compose.yml         # 只起一个 PostgreSQL
└── backend/
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py            # FastAPI 入口
        ├── config.py          # 配置（读取 .env）
        ├── database.py        # SQLAlchemy 引擎与 session
        ├── enums.py           # 状态机枚举
        ├── models.py          # 11 张数据表
        ├── schemas.py         # 请求 / 响应 Pydantic 模型
        ├── auth.py            # JWT 编解码
        ├── deps.py            # FastAPI 依赖注入（取当前用户）
        ├── mocks.py           # 短信 / OCR / 内容审核占位
        ├── seed.py            # 种子数据脚本
        └── routers/
            ├── auth.py
            ├── communities.py
            ├── books.py
            ├── listings.py
            ├── applications.py
            └── conversations.py
```

---

## 常用命令速查

```bash
# 启 / 停 PostgreSQL
docker compose up -d postgres
docker compose down                    # 停容器（数据保留）
docker compose down -v                 # 停容器并删数据卷（数据全丢）

# 重新跑 seed（必须先 down -v 把数据删掉）
docker compose down -v && docker compose up -d postgres
cd backend && python -m app.seed

# 看 API
uvicorn app.main:app --reload          # 改代码自动重启
```

---

## 下一阶段建议

1. **借阅约定文本流（v3.2 §4.4.4）**：在借阅会话顶部插入 Agreement 编辑流，双方点同意后截图归档
2. **4 张交接照片证据（v3.2 §4.3）**：交接环节强制上传，作为争议时唯一证据
3. **邻里背书全流程（v3.2 §3）**：发起 / 确认 / 拒绝 / 计入信任标记
4. **后台风控触发（v3.2 §7.2）**：自助登记的"未归还/损坏/丢失"达到阈值自动打 RiskFlag
5. **Alembic 迁移**：把现在的 `create_all` 替换成版本化迁移
6. **微信小程序前端**：从注册 → 浏览 → 上架 → 申请这条线开始
