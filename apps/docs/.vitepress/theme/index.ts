import DefaultTheme from 'vitepress/theme';
import { h, nextTick } from 'vue';
import MFUIProjectionPreview from './components/MFUIProjectionPreview.vue';
import './custom.css';

const updateCopyButtonTitles = () => {
  const title = window.location.pathname.startsWith('/zh/')
    ? '复制代码'
    : 'Copy Code';

  document.querySelectorAll('button.copy').forEach((button) => {
    button.setAttribute('title', title);
  });
};

const updateCopyButtonTitlesAfterRender = () => {
  void nextTick(() => {
    updateCopyButtonTitles();
    window.setTimeout(updateCopyButtonTitles, 0);
  });
};

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(MFUIProjectionPreview, { variant: 'hero' }),
    });
  },
  enhanceApp(context) {
    DefaultTheme.enhanceApp?.(context);
    context.app.component('MFUIProjectionPreview', MFUIProjectionPreview);

    if (typeof window === 'undefined') {
      return;
    }

    const previousOnAfterRouteChanged = context.router.onAfterRouteChanged;

    updateCopyButtonTitlesAfterRender();

    context.router.onAfterRouteChanged = (to) => {
      previousOnAfterRouteChanged?.(to);
      updateCopyButtonTitlesAfterRender();
    };
  },
};
