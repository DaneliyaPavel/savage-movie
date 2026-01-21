import { getProjectsServer } from "@/lib/api/projects"
import { toMarketingProject } from "@/lib/marketing-mappers"
import ProjectsPageClient from "./projects-client"

export const revalidate = 60

export default async function ProjectsPage() {
  try {
    const apiProjects = await getProjectsServer()
    const projects = apiProjects.map(toMarketingProject)
    return <ProjectsPageClient initialProjects={projects} />
  } catch (error) {
    console.error("Ошибка загрузки проектов (server)", error)
    return <ProjectsPageClient initialProjects={[]} />
  }
}
