import { Router } from "express";
import { requireAuth, AuthRequest } from "../auth/auth.middleware";
import { createProjectSchema, createTaskSchema, setTaskDoneSchema } from "./projects.validation";
import { createProject, listProjects, createTask, listTasks, setTaskDone } from "./projects.service";

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);

projectsRoutes.post("/", async (req: AuthRequest, res, next) => {
  try {
    const body = createProjectSchema.parse(req.body);
    const project = await createProject(req.userId!, body.name);
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
});

projectsRoutes.get("/", async (req: AuthRequest, res, next) => {
  try {
    const projects = await listProjects(req.userId!);
    res.json(projects);
  } catch (e) {
    next(e);
  }
});

projectsRoutes.post("/:projectId/tasks", async (req: AuthRequest, res, next) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const task = await createTask(req.userId!, req.params.projectId, body.title);
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

projectsRoutes.get("/:projectId/tasks", async (req: AuthRequest, res, next) => {
  try {
    const tasks = await listTasks(req.userId!, req.params.projectId);
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

projectsRoutes.patch("/:projectId/tasks/:taskId", async (req: AuthRequest, res, next) => {
  try {
    const body = setTaskDoneSchema.parse(req.body);
    const updated = await setTaskDone(req.userId!, req.params.projectId, req.params.taskId, body.done);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

