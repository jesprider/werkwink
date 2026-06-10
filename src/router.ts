import { createRouter, createWebHistory } from 'vue-router'
import LandingView from './views/LandingView.vue'
import OverviewView from './views/OverviewView.vue'
import ProjectView from './views/ProjectView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/projects', name: 'overview', component: OverviewView },
    { path: '/projects/:id', name: 'project', component: ProjectView, props: true },
  ],
})
