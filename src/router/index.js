import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginPage.vue'
import AdminDashboard from '../views/AdminPage.vue'
import ReviewProgress from '@/components/ReviewProgress.vue'
import ExpertReview from '@/views/ExpertReview.vue'
import EnterprisesList from '@/components/EnterprisesList.vue'
import ExpertExport from '@/components/ExpertExport.vue'
import GenerateExperts from '@/components/GenerateExperts.vue'
import StartReview from '@/components/StartReview.vue'
import AssignExperts from '@/components/AssignExperts.vue'
import EnterpriseExport from '@/components/EnterpriseExport.vue'
import EnterpriseSummary from '@/components/EnterpriseSummary.vue'
import ReviewExpert from '@/components/ReviewExpert.vue'
import ReviewRecords from '../views/ReviewRecords.vue';
import ReviewDetail from '../views/ReviewDetail.vue';
import AdminHomePage from '@/components/AdminHomePage.vue'
import HomePage from '@/views/HomePage.vue'
import WaitingPage from '@/views/WaitingPage.vue'
import ExpertSummary from '@/components/ExpertSummary.vue'
import TestAnalysis from '@/components/TestAnalysis.vue'
import IndicatorSummary from '@/components/IndicatorSummary.vue'
import EditReview from '@/views/EditReview.vue'
const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    children:[
      { path: 'generate-experts', component: GenerateExperts },
      { path: 'import-files', component: EnterprisesList },
      { path: 'start-review', component: StartReview },
      { path: 'review-progress', component: ReviewProgress },
      { path: 'assign-experts', component: AssignExperts },
      { path: 'analysis', component: TestAnalysis },
      { path: 'expert-export/:expert_id', component: ExpertExport }, // 添加跳转路由
      { path: 'expert-summary/:expert_id', component: ExpertSummary }, 
      {
        path: 'enterprise-export/:enterprise_id',component: EnterpriseExport
      },
      {
        path: 'enterprise-summary',
        name: 'EnterpriseSummary',
        component: EnterpriseSummary
      },
      {
        path: 'review-expert',
        component: ReviewExpert
      },
      {
        path: 'admin-home',
        component: AdminHomePage
      },
      {
        path: 'indicator-summary',
        component: IndicatorSummary
      }
    ]
  },
  {
    path: '/expert-review',
    name: 'ExpertReview',
    component: ExpertReview
  },
  { path: '/review-records', component: ReviewRecords },
  { path: '/review-records/:id', component: ReviewDetail },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/waiting-page',
    component: WaitingPage
  },
  {
    path: '/review-records/:id/edit',
    name: 'EditReview',
    component: EditReview
  }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router