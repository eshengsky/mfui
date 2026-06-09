import { defineConfig } from 'vitepress';

const enNav = [
  { text: 'Guide', link: '/guide/introduction' },
];

const zhNav = [
  { text: '指南', link: '/zh/guide/introduction' },
];

const enSidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Introduction', link: '/guide/introduction' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'Quick Start', link: '/guide/quick-start' },
      { text: 'Examples', link: '/guide/examples' },
    ],
  },
  {
    text: 'Concepts',
    items: [
      { text: 'Components', link: '/concepts/components' },
      { text: 'Layouts', link: '/concepts/layouts' },
      { text: 'Projections', link: '/concepts/projections' },
      { text: 'Semantic Streaming', link: '/concepts/semantic-streaming' },
    ],
  },
  {
    text: 'Adapters',
    items: [
      {
        text: 'OpenAI Compatible',
        link: '/adapters/openai-compatible',
      },
      { text: 'OpenAI Responses', link: '/adapters/openai-responses' },
      { text: 'Anthropic', link: '/adapters/anthropic' },
      { text: 'Gemini', link: '/adapters/gemini' },
      { text: 'Vercel AI SDK', link: '/adapters/ai-sdk' },
    ],
  },
  {
    text: 'API Reference',
    items: [
      { text: '@mfui/client', link: '/reference/client' },
      { text: '@mfui/server', link: '/reference/server' },
      {
        text: '@mfui/openai-compatible',
        link: '/reference/openai-compatible',
      },
      { text: '@mfui/openai-responses', link: '/reference/openai-responses' },
      { text: '@mfui/anthropic', link: '/reference/anthropic' },
      { text: '@mfui/gemini', link: '/reference/gemini' },
      { text: '@mfui/ai-sdk', link: '/reference/ai-sdk' },
    ],
  },
];

const zhSidebar = [
  {
    text: '指南',
    items: [
      { text: '介绍', link: '/zh/guide/introduction' },
      { text: '安装', link: '/zh/guide/installation' },
      { text: '快速开始', link: '/zh/guide/quick-start' },
      { text: '示例', link: '/zh/guide/examples' },
    ],
  },
  {
    text: '概念',
    items: [
      { text: '组件', link: '/zh/concepts/components' },
      { text: '布局', link: '/zh/concepts/layouts' },
      { text: '投影', link: '/zh/concepts/projections' },
      { text: '语义流', link: '/zh/concepts/semantic-streaming' },
    ],
  },
  {
    text: '适配器',
    items: [
      {
        text: 'OpenAI 兼容',
        link: '/zh/adapters/openai-compatible',
      },
      { text: 'OpenAI Responses', link: '/zh/adapters/openai-responses' },
      { text: 'Anthropic', link: '/zh/adapters/anthropic' },
      { text: 'Gemini', link: '/zh/adapters/gemini' },
      { text: 'Vercel AI SDK', link: '/zh/adapters/ai-sdk' },
    ],
  },
  {
    text: 'API 参考',
    items: [
      { text: '@mfui/client', link: '/zh/reference/client' },
      { text: '@mfui/server', link: '/zh/reference/server' },
      {
        text: '@mfui/openai-compatible',
        link: '/zh/reference/openai-compatible',
      },
      {
        text: '@mfui/openai-responses',
        link: '/zh/reference/openai-responses',
      },
      { text: '@mfui/anthropic', link: '/zh/reference/anthropic' },
      { text: '@mfui/gemini', link: '/zh/reference/gemini' },
      { text: '@mfui/ai-sdk', link: '/zh/reference/ai-sdk' },
    ],
  },
];

export default defineConfig({
  title: 'MFUI',
  description: 'Message-first generative UI with portable text projections.',
  cleanUrls: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: enNav,
        outline: {
          level: [2, 3],
        },
        sidebar: enSidebar,
        socialLinks: [
          { icon: 'github', link: 'https://github.com/eshengsky/mfui' },
        ],
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      description: '面向消息的生成式 UI，支持可移植文本投影。',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        socialLinks: [
          { icon: 'github', link: 'https://github.com/eshengsky/mfui' },
        ],
        darkModeSwitchLabel: '外观',
        darkModeSwitchTitle: '切换到深色主题',
        docFooter: {
          next: '下一页',
          prev: '上一页',
        },
        langMenuLabel: '切换语言',
        lastUpdated: {
          text: '最后更新',
        },
        lightModeSwitchTitle: '切换到浅色主题',
        notFound: {
          code: '404',
          title: '页面未找到',
          quote: '你访问的页面不存在。',
          linkText: '返回首页',
          linkLabel: '返回首页',
        },
        outline: {
          label: '本页目录',
          level: [2, 3],
        },
        returnToTopLabel: '返回顶部',
        sidebarMenuLabel: '菜单',
        skipToContentLabel: '跳到内容',
      },
    },
  },
});
