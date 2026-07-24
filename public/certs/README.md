# QZ Tray 证书（静默打印）

本目录放置 QZ Tray 数字证书与私钥，实现**静默打印**（不再每次弹授权框）。

当前阶段**可以不放证书**：连接与打印仍可用，但 QZ Tray 会弹出「Allow / Block」授权对话框。

## 前端静默打印（推荐 Demo / 内网）

1. 安装并启动 [QZ Tray](https://qz.io/download)
2. 打开 **QZ Tray → Advanced → Site Manager**
3. 点击 `+` → **Create New**，按提示生成本机 demo 证书
4. 桌面会生成 `QZ Tray Demo Cert` 文件夹
5. 将其中两个文件复制到本目录：

```
public/certs/digital-certificate.txt
public/certs/private-key.pem
```

6. 重启/刷新前端；`qzClient.js` 会自动加载证书并用私钥在浏览器内签名

依赖：`jsrsasign`（已在 package.json）。

## 导入到另一台电脑

网站侧仍用同一套 `digital-certificate.txt` + `private-key.pem`。

另一台电脑的 QZ Tray 需要信任同一张证书：

1. 安装并启动 QZ Tray
2. 打开 **Advanced → Site Manager**
3. 用 **Browse** 选择本机生成时得到的证书文件（常见为桌面 `QZ Tray Demo Cert` 里的证书 / `override.crt`）导入
4. 按提示确认安装后，**重启 QZ Tray**

导入完成后，该机访问同一前端即可静默打印，无需在每台机器重新 Create New。

## 后端签名（可选）

若不想把私钥暴露给浏览器，可只放证书，签名走后端：

- 私钥仅放服务端
- 后端提供签名接口（例如 `GET /api/qz/sign?request=...` 返回 base64 签名）
- 前端：`setQzSignatureEndpoint('/api/qz/sign?request=')`

配置了签名接口时，**优先走后端**，不再读前端的 `private-key.pem`。

参考：

- [Getting Started](https://qz.io/docs/getting-started)
- [Signing Messages](https://qz.io/docs/signing)
- [Signing Examples（含前端签名）](https://qz.io/docs/signing-examples)

## 文件说明

| 文件 | 是否提交到 Git | 说明 |
|------|----------------|------|
| `README.md` | 是 | 本说明 |
| `digital-certificate.txt` | 默认 gitignore | 公钥证书 |
| `private-key.pem` | 默认 gitignore | 私钥；前端签名时放此目录 |

> Demo 证书默认被 `.gitignore` 忽略。若团队约定可入库，自行 `git add -f` 即可。
