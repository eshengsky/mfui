---
layout: home

hero:
  name: MFUI
  text: 可复制的生成式 UI
  tagline: MFUI 让模型回复同时拥有组件 UI 和文本投影，兼顾展示、交互、复制和上下文。
  actions:
    - theme: brand
      text: 开始了解
      link: /zh/guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/eshengsky/mfui

features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5 9.8 8.9a2 2 0 0 1-1.4 1.4L2 12l6.4 1.7a2 2 0 0 1 1.4 1.4l1.7 6.4 1.7-6.4a2 2 0 0 1 1.4-1.4L21 12l-6.4-1.7a2 2 0 0 1-1.4-1.4z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>'
    title: 生成式 UI
    details: 让模型回复不止是 Markdown，而是可以渲染时间线、表单、图表、卡片等更丰富的组件。
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h6"/><path d="M8 9h2"/></svg>'
    title: 文本投影
    details: 每个组件都有稳定文本版本，可用于复制、搜索、存储，也能继续作为模型上下文。
  - title: 服务端校验
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/></svg>'
    details: 模型返回的组件数据会在服务端校验，再交给客户端渲染，减少无效组件和脏数据。
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8Z"/></svg>'
    title: 轻量集成
    details: 前端定义组件和 schema，服务端接入现有模型调用，不需要迁移到新的应用框架。
---
