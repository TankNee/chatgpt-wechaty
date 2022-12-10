<h1 align="center">Yet Another GPTChat Bot</h1>
<h3 align="center">Powered By Wechaty</h3>

<h5 align="center"><a href="./README.md">简体中文</a> | English</h5>

Based on Wechaty, GPTChat and Padlocal.

## Usage

### 1. Install

```bash
npm install
```

### 2. Configure

You need padlocal token to start the wechaty robot. And you can obtain it from [padlocal](http://pad-local.com/#/) website. All accounts can be used, and there is no limit on the web version.

What's more, you need GPTChat serviceToken to start the GPTChat robot. And you can obtain it from [GPTChat](https://chat.openai.com/chat) website. The specific steps are as follows:

1. Login https://chat.openai.com/chat
2. Use F12 to open the browser console
3. Open the Application tab and find the Cookies item

![](https://user-images.githubusercontent.com/36258159/205494773-32ef651a-994d-435a-9f76-a26699935dac.png)

Finally, put these two items into the `.env.development.local.example` file, and then copy a copy as the `.env.development.local` file.


```bash
cp .env.development.local.example .env.development.local
```

### 3. Run

```bash
npm run dev
```

## Reference

- [Wechaty](https://wechaty.js.org/)
- [GPTChat](https://chat.openai.com/chat)
- [Padlocal](http://pad-local.com/#/)
- [ChatGPT API](https://github.com/transitive-bullshit/chatgpt-api)
