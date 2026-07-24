# QZ Tray 证书（静默打印）

本目录放置 QZ Tray 数字证书与私钥，实现**静默打印**（不再每次弹授权框）。

不放证书也可以连接与打印，但 QZ Tray 会弹出「Allow / Block」授权对话框。

## 本项目默认：前端签名

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

### 关于私钥放前端

QZ 只连接**本机**打印机，密钥泄露不能远程打到你场地的设备。  
实际风险仅限：某台电脑已用 Site Manager 信任了这套证书，又被恶意网页拿到私钥时，可在该机静默调用本地打印机。Demo / 内网场景通常可接受。

## 导入到另一台电脑

网站侧仍用同一套 `digital-certificate.txt` + `private-key.pem`。

另一台电脑的 QZ Tray 需要信任同一张证书：

1. 安装并启动 QZ Tray
2. 打开 **Advanced → Site Manager**
3. 用 **Browse** 选择生成时得到的信任证书（桌面 `QZ Tray Demo Cert` 中的证书，或同目录下的 `override.crt`）导入
4. 按提示确认后，**重启 QZ Tray**

导入完成后，该机访问同一前端即可静默打印，无需重新 Create New。

## 后端签名（可选）

本仓库不实现后端签名。若宿主项目自行提供签名接口，可调用 `setQzSignatureEndpoint('/api/qz/sign?request=')`；配置后优先走后端，不再读本目录的 `private-key.pem`。

参考：[Getting Started](https://qz.io/docs/getting-started) · [Signing](https://qz.io/docs/signing) · [Signing Examples](https://qz.io/docs/signing-examples)

## 文件说明

| 文件 | 说明 |
|------|------|
| `README.md` | 本说明 |
| `digital-certificate.txt` | 公钥证书；可随仓库提交 |
| `private-key.pem` | 私钥；前端签名时放此目录，是否入库由团队自行约定 |
