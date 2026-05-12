export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/new-listing/index',
    'pages/applications/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/listing-detail/index',
    'pages/conversation/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '以书会友',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#aaaaaa',
    selectedColor: '#ff5722',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/new-listing/index', text: '上架' },
      { pagePath: 'pages/applications/index', text: '申请' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
})
