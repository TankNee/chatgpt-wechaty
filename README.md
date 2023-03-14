<h1 align="center">又一个 GPTChat 微信机器人</h1>
<h3 align="center">Powered By Wechaty</h3>

<h5 align="center">简体中文 | <a href="./README-en.md">English</a></h5>

基于 Wechaty，GPTChat 和 Padlocal。

## 使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 配置

现在本项目只支持使用 openai 的 api-key 来调用 GPTChat，所以需要先去 [openai](https://openai.com/) 注册账号，然后在管理页面获取 api-key。

拿到 api-key 之后，需要将其放入 `.env.development.local.example` 文件中，然后复制一份为 `.env.development.local` 文件。


```bash
cp .env.development.local.example .env.development.local
```

### 3. 运行

```bash
npm run dev
```

## Reference

- [Wechaty](https://wechaty.js.org/)
- [GPTChat](https://chat.openai.com/chat)
- [Padlocal](http://pad-local.com/#/)
- [ChatGPT API](https://github.com/transitive-bullshit/chatgpt-api)
