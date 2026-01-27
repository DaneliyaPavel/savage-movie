import { getProjectsServer } from "@/features/projects/api"
import { toMarketingProject } from "@/features/projects/mappers"
import ProjectsPageClient from "./projects-client"

export const revalidate = 60

export default async function ProjectsPage() {
  const projects = await loadProjects()
  return <ProjectsPageClient initialProjects={projects} />
}

async function loadProjects() {
  try {
    const apiProjects = await getProjectsServer()
    return apiProjects.map(toMarketingProject)
  } catch (error) {
    console.error("Ошибка загрузки проектов (server)", error)
    return []
  }
}
