# 腾讯云 CloudBase 防伪后台部署清单

环境：`huiyufanwei-d1gxo7j1r82311dae`（上海）。目前线上数据库已建立基础四表，但尚未导入真实防伪码。

## 回来后按顺序完成

1. 在 PostgreSQL 的 SQL 编辑器执行 `002_add_order_hash.sql`。结果应显示 `order_hash / character / 64`。
2. 在本机运行 `node tools/generate-secret.mjs`，生成一次专用密钥。不要截图、不要发群、不要提交 Git；把它保存到密码管理器。
3. 新建普通云函数 `verify-authenticity`，使用 Node.js 18 或平台当前 LTS。上传 `output/verify-authenticity-cloud-function.zip`，开启自动安装依赖。
4. 给函数设置环境变量：
   - `VERIFICATION_HASH_PEPPER`：第 2 步的密钥。
   - `ALLOWED_ORIGINS`：逗号分隔的官网来源，例如 `https://账号.github.io`；正式域名确定后追加。
5. 在 HTTP 网关创建 `/api/verify` 路由，绑定此函数，允许 `GET,POST,OPTIONS`。不要配置腾讯云 SecretId/SecretKey 到网页或函数代码。
6. 用浏览器访问网关完整地址。GET 返回 `status: ready` 后，把该完整 HTTPS 地址写入网站构建环境的 `VITE_VERIFICATION_API_URL`。
7. 重新构建网站。未填写该变量时，网站自动保留虚构演示；填写有效 HTTPS 地址后自动切换到正式核验界面。

## 导入真实防伪码（取得最终表格后再做）

复制 `code-import-template.csv`，保留四列标题并填入真实数据。示例行只是说明，不能直接导入。使用与云函数完全相同的密钥，在 PowerShell 里运行：

```powershell
$env:VERIFICATION_HASH_PEPPER='这里填写密钥'
node tools/build-code-import.mjs '.\待导入.csv' '.\authenticity-code-import.sql'
Remove-Item Env:VERIFICATION_HASH_PEPPER
```

生成的 SQL 只包含防伪码和订单号的 HMAC 索引，不包含原文。先人工核对条数和批次，再在 SQL 编辑器执行。原始 CSV 仍属于敏感客户资料，不应放进 GitHub 源码包。

## 上线前核对

- 首次正确核验返回“首次核验通过”，第二次返回重复核验次数和首次时间。
- 防伪码正确但订单错误，与完全不存在的编号使用相同模糊提示。
- 连续高频查询会限速；客服可用查询编号排查，前台不会显示数据库内部备注。
- `VERIFICATION_HASH_PEPPER` 一旦用于生成导入 SQL，不要随意更换，否则已有记录将无法匹配。
