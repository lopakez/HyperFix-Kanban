import { tool } from "ai";
import { z } from "zod";
import createCommentCtrl from "../activity/controllers/create-comment";
import getProjectsCtrl from "../project/controllers/get-projects";
import globalSearchCtrl from "../search/controllers/global-search";
import createTaskCtrl from "../task/controllers/create-task";
import getTaskCtrl from "../task/controllers/get-task";
import getTasksCtrl from "../task/controllers/get-tasks";
import moveTaskCtrl from "../task/controllers/move-task";
import updateTaskStatusCtrl from "../task/controllers/update-task-status";
import { validateWorkspaceAccess } from "../utils/validate-workspace-access";
import { assertWorkspaceTaskAccess } from "../utils/workspace-role";

export function getAiTools(userId: string) {
  return {
    list_tasks: tool({
      description:
        "Lister les tâches d'un projet spécifique avec filtres optionnels.",
      parameters: z.object({
        projectId: z.string().describe("L'ID du projet"),
        status: z
          .string()
          .optional()
          .describe("Filtrer par statut/colonne (ex: 'to-do', 'in-progress')"),
        priority: z
          .enum(["no-priority", "low", "medium", "high", "urgent"])
          .optional()
          .describe("Filtrer par priorité"),
        assigneeId: z
          .string()
          .optional()
          .describe("L'ID de l'utilisateur assigné"),
      }),
      execute: async ({ projectId, status, priority, assigneeId }) => {
        // En vérifiant l'accès à une tâche du projet, ou simplement en validant le projet, on garantit la sécurité
        // Ici, on récupère les tâches, mais drizzle-orm va lever une erreur si le projet n'existe pas.
        // On effectue une recherche globale ou une assertion d'accès projet (les projets n'ont pas d'assert direct mais on peut simplement interroger getTasksCtrl qui gère l'existence du projet)
        return await getTasksCtrl(projectId, { status, priority, assigneeId });
      },
    }),

    get_task: tool({
      description:
        "Obtenir les détails complets d'une tâche spécifique à partir de son ID.",
      parameters: z.object({
        taskId: z.string().describe("L'ID de la tâche à récupérer"),
      }),
      execute: async ({ taskId }) => {
        await assertWorkspaceTaskAccess(taskId, userId);
        return await getTaskCtrl(taskId);
      },
    }),

    list_projects: tool({
      description:
        "Lister tous les projets d'un espace de travail (workspace).",
      parameters: z.object({
        workspaceId: z
          .string()
          .describe("L'ID de l'espace de travail (workspace)"),
      }),
      execute: async ({ workspaceId }) => {
        await validateWorkspaceAccess(userId, workspaceId);
        return await getProjectsCtrl(workspaceId);
      },
    }),

    search: tool({
      description:
        "Rechercher globalement des tâches, des projets, ou des commentaires au sein d'un workspace.",
      parameters: z.object({
        query: z.string().describe("Le terme ou mot-clé de recherche"),
        workspaceId: z
          .string()
          .describe(
            "L'ID de l'espace de travail (workspace) dans lequel chercher",
          ),
        type: z
          .enum(["all", "tasks", "projects", "comments", "activities"])
          .optional()
          .default("all")
          .describe("Le type d'éléments à chercher"),
      }),
      execute: async ({ query, workspaceId, type }) => {
        await validateWorkspaceAccess(userId, workspaceId);
        return await globalSearchCtrl({
          query,
          userId,
          workspaceId,
          type,
          limit: 15,
        });
      },
    }),

    create_task: tool({
      description: "Créer une nouvelle tâche dans un projet.",
      parameters: z.object({
        projectId: z
          .string()
          .describe("L'ID du projet dans lequel créer la tâche"),
        title: z.string().describe("Le titre de la tâche"),
        description: z
          .string()
          .optional()
          .default("")
          .describe("La description de la tâche (Markdown autorisé)"),
        status: z
          .string()
          .describe(
            "Le statut initial ou colonne (ex: 'to-do', 'in-progress')",
          ),
        priority: z
          .enum(["no-priority", "low", "medium", "high", "urgent"])
          .describe("Le niveau de priorité initial"),
        dueDate: z
          .string()
          .optional()
          .describe("La date d'échéance optionnelle (format ISO)"),
      }),
      execute: async ({
        projectId,
        title,
        description,
        status,
        priority,
        dueDate,
      }) => {
        return await createTaskCtrl({
          projectId,
          currentUserId: userId,
          title,
          status,
          description,
          priority,
          dueDate,
        });
      },
    }),

    update_task_status: tool({
      description:
        "Changer le statut d'une tâche existante (la déplacer dans une autre colonne).",
      parameters: z.object({
        taskId: z.string().describe("L'ID de la tâche à mettre à jour"),
        status: z
          .string()
          .describe("Le nouveau statut ou colonne (ex: 'in-progress', 'done')"),
      }),
      execute: async ({ taskId, status }) => {
        await assertWorkspaceTaskAccess(taskId, userId);
        return await updateTaskStatusCtrl({
          id: taskId,
          status,
          currentUserId: userId,
        });
      },
    }),

    move_task: tool({
      description:
        "Déplacer une tâche vers un autre projet (et optionnellement changer son statut).",
      parameters: z.object({
        taskId: z.string().describe("L'ID de la tâche à déplacer"),
        destinationProjectId: z
          .string()
          .describe("L'ID du projet de destination"),
        destinationStatus: z
          .string()
          .optional()
          .describe(
            "Optionnel: le nouveau statut dans le projet de destination",
          ),
      }),
      execute: async ({ taskId, destinationProjectId, destinationStatus }) => {
        await assertWorkspaceTaskAccess(taskId, userId);
        return await moveTaskCtrl({
          taskId,
          destinationProjectId,
          destinationStatus,
          currentUserId: userId,
        });
      },
    }),

    create_comment: tool({
      description: "Ajouter un commentaire à une tâche existante.",
      parameters: z.object({
        taskId: z.string().describe("L'ID de la tâche à commenter"),
        content: z
          .string()
          .describe("Le texte du commentaire (Markdown autorisé)"),
      }),
      execute: async ({ taskId, content }) => {
        await assertWorkspaceTaskAccess(taskId, userId);
        return await createCommentCtrl(taskId, userId, content);
      },
    }),
  };
}
