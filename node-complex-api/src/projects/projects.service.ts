import { prisma } from "../db";

export async function createProject(ownerId: string, name: string) {
  return prisma.project.create({
    data: { ownerId, name },
    select: { id: true, name: true, createdAt: true }
  });
}

export async function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true }
  });
}

export async function createTask(ownerId: string, projectId: string, title: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) {
    const err: any = new Error("project not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.task.create({
    data: { projectId, title },
    select: { id: true, title: true, done: true, createdAt: true, projectId: true }
  });
}

export async function listTasks(ownerId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) {
    const err: any = new Error("project not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, done: true, createdAt: true, projectId: true }
  });
}

export async function setTaskDone(ownerId: string, projectId: string, taskId: string, done: boolean) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) {
    const err: any = new Error("project not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure task belongs to that project
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    const err: any = new Error("task not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { done },
    select: { id: true, title: true, done: true, createdAt: true, projectId: true }
  });
}

