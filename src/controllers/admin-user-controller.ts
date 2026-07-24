import { z } from "zod";

import { listAdminUsers, updateAdminUserState } from "../repositories/user-repository";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";

const adminUserUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  isBlocked: z.boolean().optional(),
  deleted: z.boolean().optional()
}).refine((input) => Object.values(input).some((value) => value !== undefined), {
  message: "Потрібно передати хоча б одну зміну стану користувача."
});

export async function getAdminUsers(context: HandlerContext): Promise<void> {
  const users = await listAdminUsers();
  sendJson(context.res, 200, { items: users });
}

export async function updateAdminUser(context: HandlerContext): Promise<void> {
  const input = adminUserUpdateSchema.parse(context.body);
  const user = await updateAdminUserState({
    userId: context.params.userId,
    role: input.role,
    isBlocked: input.isBlocked,
    deleted: input.deleted,
    actingUserId: context.user!.userId
  });

  if (!user) {
    sendJson(context.res, 404, { code: "user_not_found", message: "Користувача не знайдено." });
    return;
  }

  sendJson(context.res, 200, { item: user });
}