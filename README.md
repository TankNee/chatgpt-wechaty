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

你需要 padlocal 的 token，可以通过 [Padlocal](http://pad-local.com/#/) 获取，直接注册即可获得 7 天的试用，所有账号都可以使用，没有网页版的限制。

其次，你需要 GPTChat 的 token，可以通过 [GPTChat](https://chat.openai.com/chat) 获取，具体获取步骤如下

登录 https://chat.openai.com/chat

1. 使用 F12 打开浏览器控制台

2. 打开 应用（Application） 标签页，找到 Cookies 项

![](https://user-images.githubusercontent.com/36258159/205494773-32ef651a-994d-435a-9f76-a26699935dac.png)

最后将这两项全部放入 `.env.development.local.example` 文件中，然后复制一份为 `.env.development.local` 文件。

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
