import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120)
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200)
});

export const setTaskDoneSchema = z.object({
  done: z.boolean()
});

