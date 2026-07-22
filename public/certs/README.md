# QZ Tray 证书（静默打印）

本目录用于放置 QZ Tray 数字证书，实现**静默打印**（不再每次弹授权框）。

当前阶段**可以不放证书**：连接与打印仍可用，但 QZ Tray 会弹出「Allow / Deny」授权对话框。

## 开发用 Demo 证书

1. 安装并启动 [QZ Tray](https://qz.io/download)
2. 打开 **QZ Tray → Advanced → Site Manager**
3. 点击 `+` → **Create New**，按提示生成本机 demo 证书
4. 桌面会生成 `QZ Tray Demo Cert` 文件夹
5. 将其中的 `digital-certificate.txt` 复制到本目录：

```
public/certs/digital-certificate.txt
```

6. 重启/刷新前端；`qzClient.js` 会自动检测并挂载证书

## 签名（私钥）

真正的静默打印还需要用 **private-key.pem** 对每次请求签名：

- **不要**把私钥提交到前端仓库
- 应在后端提供签名接口（例如 `GET /api/qz/sign?request=...` 返回 base64 签名）
- 前端通过 `setQzSignatureEndpoint('/api/qz/sign?request=')` 配置

参考：

- [Getting Started](https://qz.io/docs/getting-started)
- [Signing Messages](https://qz.io/docs/signing)
- [Pixel / Image Printing](https://qz.io/docs/pixel)

## 文件说明

| 文件 | 是否提交到 Git | 说明 |
|------|----------------|------|
| `README.md` | 是 | 本说明 |
| `digital-certificate.txt` | 可选（仅 demo） | 公钥证书 |
| `private-key.pem` | **否** | 私钥，仅放服务端 |
